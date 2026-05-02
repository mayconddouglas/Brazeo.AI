import { getServiceSupabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { executeTool } from './executor';
import { routeModel } from './model-router';
import { registrarAtividade, registrarTema } from '@/lib/routine-engine';
import { extrairEsalvarMemoriasDeConversa, recuperarMemoriasRelevantes } from '@/lib/memory-engine';

// Initialize base OpenRouter helper function to create dynamic instances
const createOpenAIClient = (apiKey: string | undefined) => {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: apiKey || process.env.OPENROUTER_API_KEY || 'dummy-key-for-build',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'Brazeo.IA',
    }
  });
};

const PLAN_LIMITS: Record<string, number> = { free: 30, beta: 100, premium: Infinity };

async function searchKnowledgeBase(query: string, apiKey: string, supabase: any) {
  if (!apiKey || apiKey.startsWith('gsk_')) return ''; // Groq doesn't support embeddings

  try {
    const openai = new OpenAI({ apiKey });
    
    // 1. Convert user message to embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });

    const embedding = response.data[0].embedding;

    // 2. Search Supabase via RPC
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.3, // 30% similarity threshold
      match_count: 3        // get top 3 most relevant chunks
    });

    if (error) {
      console.error("RPC Error:", error);
      return '';
    }

    if (!data || data.length === 0) return '';

    // 3. Format the retrieved knowledge
    const contextText = data.map((d: any) => d.content).join('\n\n');
    return `\n[BASE DE CONHECIMENTO DA EMPRESA]\nUtilize as informações abaixo para responder a pergunta do usuário, caso sejam relevantes:\n${contextText}\n`;
    
  } catch (err) {
    console.error("Knowledge Base Search Error:", err);
    return '';
  }
}

export async function runAgent(phone: string, content: string | any[]): Promise<string> {
  const contentString = Array.isArray(content) 
    ? `[Imagem enviada pelo usuário]${content[1].text !== "O que você vê nessa imagem? Descreva e ajude o usuário." ? " " + content[1].text : ""}`
    : content;

  const isTestMode = phone === "test-admin-dashboard";
  const supabase = getServiceSupabase();
  let user: any = { id: 'mock-user-id', status: 'active', phone };
  let history: any[] = [];
  let filteredHistory: any[] = [];
  let userMessageId: string | null = null;
  let usageNotice: string | null = null;

  try {
    if (!isTestMode) {
      // 1. Identify User
      let { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // User not found, create them with waitlist status
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ phone, status: 'waitlist' }])
          .select()
          .single();
          
        if (!createError) user = newUser;
        
        const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
        const waitlistWelcome = "Oi! 👋 A Safira ainda está em beta fechado 🔒\nMas já anotei seu interesse na lista de espera!\nAssim que uma vaga abrir, você será um dos primeiros a saber. 😊\nEnquanto isso, me conta seu nome pra eu guardar!";
        
        sendWhatsAppMessage(phone, waitlistWelcome, settings).catch(console.error);
        return waitlistWelcome;
      } else if (!userError && dbUser) {
        user = dbUser;
      }

      if (user.status === 'blocked') {
        const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
        const blockedMsg = "Sua conta não está ativa no momento.\nEntre em contato com o suporte pelo @brazeo.ai no Instagram.";
        sendWhatsAppMessage(phone, blockedMsg, settings).catch(console.error);
        return blockedMsg;
      }

      if (user.status === 'waitlist') {
        const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
        if (!user.name || user.name.trim() === '') {
          const openai = createOpenAIClient(settings?.openrouter_api_key);
          const nameExtractionResponse = await openai.chat.completions.create({
            model: 'anthropic/claude-haiku-4-5',
            messages: [{ 
              role: 'user', 
              content: `O usuário está respondendo a uma mensagem pedindo o nome dele para uma lista de espera. Extraia APENAS o primeiro nome do usuário a partir desta mensagem. Retorne apenas o nome, sem nenhuma outra palavra, pontuação ou saudação. Se não conseguir identificar um nome claro, retorne a palavra "Desconhecido". Mensagem: "${contentString}"` 
            }]
          });
          
          let extractedName = nameExtractionResponse.choices[0].message?.content?.trim() || 'Desconhecido';
          extractedName = extractedName.replace(/^["']|["']$/g, '');

          if (extractedName !== 'Desconhecido' && extractedName.length > 0) {
            await supabase.from('users').update({ name: extractedName }).eq('id', user.id);
            const replyText = `Prontinho, ${extractedName}! Nome guardado. Em breve entraremos em contato. 😉`;
            sendWhatsAppMessage(phone, replyText, settings).catch(console.error);
            return replyText;
          } else {
            const askAgainText = "Desculpe, não consegui entender o seu nome. Poderia me dizer apenas o seu nome ou como prefere ser chamado?";
            sendWhatsAppMessage(phone, askAgainText, settings).catch(console.error);
            return askAgainText;
          }
        } else {
          const waitlistMsg = "Você já está na nossa lista de espera! 🙌\nAssim que uma vaga abrir no beta, você será avisado aqui mesmo. Obrigada pela paciência! 😊";
          sendWhatsAppMessage(phone, waitlistMsg, settings).catch(console.error);
          return waitlistMsg;
        }
      }

      if (user.status !== 'active') {
        console.log(`User ${phone} is not active. Status: ${user.status}`);
        return 'Sua conta está inativa no momento.';
      }

      const dailyLimit = PLAN_LIMITS[user.plan] ?? 30;
      const todayUtc = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Sao_Paulo'
      });
      const prefs = user.preferences || {};
      if (prefs.data_contagem !== todayUtc) {
        prefs.msgs_hoje = 0;
        prefs.data_contagem = todayUtc;
        prefs.aviso_limite_80_data = null;
      }

      const msgsHoje = typeof prefs.msgs_hoje === 'number' ? prefs.msgs_hoje : 0;
      if (Number.isFinite(dailyLimit) && msgsHoje >= dailyLimit) {
        const limitMsg = `Você atingiu o limite de ${dailyLimit} mensagens por hoje. 😊\nSeu limite renova à meia-noite. Até lá!`;
        sendWhatsAppMessage(phone, limitMsg, user.settings).catch(console.error);
        return limitMsg;
      }

      const msgsHojeDepois = msgsHoje + 1;
      prefs.msgs_hoje = msgsHojeDepois;
      user.preferences = prefs;
      await supabase.from('users').update({ preferences: prefs }).eq('id', user.id);

      if (Number.isFinite(dailyLimit)) {
        const threshold80 = Math.ceil(dailyLimit * 0.8);
        const alreadyWarned = prefs.aviso_limite_80_data === todayUtc;
        if (!alreadyWarned && msgsHojeDepois >= threshold80) {
          prefs.aviso_limite_80_data = todayUtc;
          usageNotice = `Você já usou ${msgsHojeDepois} das suas ${dailyLimit} mensagens de hoje 📊\nAmanhã o limite renova. Posso ajudar com mais algo?`;
          await supabase.from("users").update({ preferences: prefs }).eq("id", user.id);
        }
      }

      // Update last seen
      await supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);
      registrarAtividade(user.id).catch(() => {});
      extrairEsalvarMemoriasDeConversa(user.id, contentString, '').catch(() => {});

      // Save user message and get its ID
      const { data: insertedMessage } = await supabase.from('messages').insert([{
        user_id: user.id,
        role: 'user',
        content: contentString
      }]).select('id').single();
      
      if (insertedMessage) {
        userMessageId = insertedMessage.id;
      }

      // 2. Load Context (last 10 messages)
      const { data: historyData } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(11);

      filteredHistory = historyData ? historyData.slice(1) : [];
        
      if (historyData) {
        history = filteredHistory.reverse();
      }
    }
    
    // Load agent settings
    const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (settings) {
      user.settings = settings;
    }
    
    if (isTestMode) {
      user.name = "Admin de Teste";
    }
  } catch (error) {
    console.warn('Supabase is not configured or failed. Running in memory mode.', error);
    try {
      await supabase.from('agent_logs').insert({
        type: 'error',
        message: (error as any)?.message || String(error),
        context: JSON.stringify({ phone, content: contentString.slice(0, 200) }),
        created_at: new Date().toISOString()
      });
    } catch {}
  }

  try {
    const openai = createOpenAIClient(user.settings?.openrouter_api_key);

    if (!isTestMode) {
      const focoAtivo = user.preferences?.foco_ativo;
      if (focoAtivo && focoAtivo.termina_em) {
        const now = new Date();
        const endsAt = new Date(focoAtivo.termina_em);
        const textLc = contentString.toLowerCase();
        const isUrgent = textLc.includes('urgente') || textLc.includes('emergência') || textLc.includes('emergencia') || textLc.includes('ajuda');

        if (Number.isFinite(endsAt.getTime()) && now < endsAt && !isUrgent) {
          const endTime = endsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const focusMsg = `Você está em modo foco até ${endTime} 🎯 focando em: ${focoAtivo.tarefa}.\nMe chama quando terminar! 💪`;

          try {
            await supabase.from('messages').insert([{
              user_id: user.id,
              role: 'assistant',
              content: focusMsg,
              intent: 'resposta_livre'
            }]);
          } catch {}

          sendWhatsAppMessage(phone, focusMsg, user.settings).catch(console.error);
          return focusMsg;
        }

        if (Number.isFinite(endsAt.getTime()) && now >= endsAt) {
          const prefs = user.preferences || {};
          const minutos = focoAtivo.minutos;
          delete prefs.foco_ativo;
          await supabase.from('users').update({ preferences: prefs }).eq('id', user.id);

          const endMsg = `Seu foco de ${minutos} min acabou! 🎉\nComo foi? Conseguiu focar na tarefa?`;

          try {
            await supabase.from('messages').insert([{
              user_id: user.id,
              role: 'assistant',
              content: endMsg,
              intent: 'resposta_livre'
            }]);
          } catch {}

          sendWhatsAppMessage(phone, endMsg, user.settings).catch(console.error);
          return endMsg;
        }
      }
    }
    
    // --- LÓGICA DE ONBOARDING ---
    if (!user.name || user.name.trim() === '') {
      const hasAssistantMessage = history.some(m => m.role === 'assistant');

      if (!hasAssistantMessage) {
        const welcomeText = "Olá! 👋 Eu sou a Safira, sua assistente pessoal inteligente da Brazeo.IA.\n\nEstou aqui para deixar seu dia mais prático e descomplicado. Posso te ajudar com:\n✅ *Lembretes* para você não esquecer de nada\n✅ *Planejamento* das tarefas da semana\n✅ *Resumos* de textos longos\n✅ *Consultas rápidas* e tira-dúvidas\n\nPara começarmos bem, como você gostaria que eu te chamasse?";
        
        await supabase.from('messages').insert([{
          user_id: user.id,
          role: 'assistant',
          content: welcomeText,
          intent: 'onboarding_welcome'
        }]);

        sendWhatsAppMessage(phone, welcomeText, user.settings).catch(console.error);
        return welcomeText;
      } else {
        const nameExtractionResponse = await openai.chat.completions.create({
          model: 'anthropic/claude-haiku-4-5',
          messages: [{ 
            role: 'user', 
            content: `O usuário está respondendo a uma mensagem de boas-vindas perguntando o nome dele. Extraia APENAS o primeiro nome do usuário a partir desta mensagem. Retorne apenas o nome, sem nenhuma outra palavra, pontuação ou saudação. Se não conseguir identificar um nome claro, retorne a palavra "Desconhecido". Mensagem: "${contentString}"` 
          }]
        });
        
        let extractedName = nameExtractionResponse.choices[0].message?.content?.trim() || 'Desconhecido';
        extractedName = extractedName.replace(/^["']|["']$/g, '');

        if (extractedName !== 'Desconhecido' && extractedName.length > 0) {
          await executeTool('memorizar_informacao', { fato: `O nome do usuário é ${extractedName}` }, user);
          await supabase.from('users').update({ name: extractedName }).eq('id', user.id);
          
          const replyText = `Prazer em te conhecer, ${extractedName}! Qual é a sua data de aniversário? Assim posso te surpreender no dia especial! 🎂 (me fala no formato dia/mês, ex: 15/03)`;
          
          await supabase.from('messages').insert([{
            user_id: user.id,
            role: 'assistant',
            content: replyText,
            intent: 'onboarding_complete'
          }]);

          sendWhatsAppMessage(phone, replyText, user.settings).catch(console.error);
          return replyText;
        } else {
          const askAgainText = "Desculpe, não consegui entender o seu nome. Poderia me dizer apenas o seu nome ou como prefere ser chamado?";
          await supabase.from('messages').insert([{
            user_id: user.id,
            role: 'assistant',
            content: askAgainText,
            intent: 'onboarding_retry'
          }]);
          sendWhatsAppMessage(phone, askAgainText, user.settings).catch(console.error);
          return askAgainText;
        }
      }
    }
    // --- FIM DA LÓGICA DE ONBOARDING ---

    if (user.name && user.name.trim() !== '' && (!user.cidade || user.cidade.trim() === '') && history.length < 5) {
      const lastMsg = [...history].reverse().find(m => m.role === 'assistant');
      const askingBirthday = lastMsg && String(lastMsg.content || '').includes('data de aniversário');
      if (askingBirthday) {
      } else {
        const lastAssistantMessage = [...history].reverse().find(m => m.role === 'assistant');
        const askedLocation = lastAssistantMessage && String(lastAssistantMessage.content || '').includes('em qual cidade e bairro você mora');

        if (!askedLocation) {
          const replyText = `Ótimo, ${user.name}! Para te dar recomendações de lugares, eventos e\ncinema perto de você, me fala: em qual cidade e bairro você mora?\n😊 (ex: Recife, Boa Viagem)`;

          await supabase.from('messages').insert([{
            user_id: user.id,
            role: 'assistant',
            content: replyText,
            intent: 'onboarding_location'
          }]);

          sendWhatsAppMessage(phone, replyText, user.settings).catch(console.error);
          return replyText;
        }

        const locationExtractionResponse = await openai.chat.completions.create({
          model: 'anthropic/claude-haiku-4-5',
          messages: [{
            role: 'user',
            content: `Extraia a cidade e o bairro da seguinte mensagem do usuário.\nResponda APENAS em JSON no formato:\n{ \"cidade\": \"nome da cidade\", \"bairro\": \"nome do bairro ou null\" }\nMensagem: ${contentString}`
          }]
        });

        const raw = locationExtractionResponse.choices[0].message?.content?.trim() || '';
        let parsed: any = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            try {
              parsed = JSON.parse(raw.slice(start, end + 1));
            } catch {}
          }
        }

        const cidadeExtraida = parsed?.cidade ? String(parsed.cidade).trim() : '';
        const bairroExtraido = parsed?.bairro ? String(parsed.bairro).trim() : null;

        if (!cidadeExtraida) {
          const replyText = `Ótimo, ${user.name}! Para te dar recomendações de lugares, eventos e\ncinema perto de você, me fala: em qual cidade e bairro você mora?\n😊 (ex: Recife, Boa Viagem)`;
          await supabase.from('messages').insert([{
            user_id: user.id,
            role: 'assistant',
            content: replyText,
            intent: 'onboarding_location_retry'
          }]);

          sendWhatsAppMessage(phone, replyText, user.settings).catch(console.error);
          return replyText;
        }

        await supabase.from('users').update({
          cidade: cidadeExtraida,
          bairro: bairroExtraido || null
        }).eq('id', user.id);

        user.cidade = cidadeExtraida;
        user.bairro = bairroExtraido || null;
      }
    }

    // --- LÓGICA DE FEEDBACK ---
    const trimmedContent = contentString.trim();
    if (['1', '2', '3'].includes(trimmedContent)) {
      const aguardandoFeedback = user.preferences?.aguardando_feedback === true;
      if (aguardandoFeedback) {
        await supabase.from('feedbacks').insert([{
          user_id: user.id,
          score: parseInt(trimmedContent)
        }]);

        const prefs = user.preferences || {};
        prefs.aguardando_feedback = false;
        await supabase.from('users').update({ preferences: prefs }).eq('id', user.id);

        const replyText = "Muito obrigada pelo seu feedback! Isso me ajuda a melhorar cada vez mais. 🥰";
        
        await supabase.from('messages').insert([{
          user_id: user.id,
          role: 'assistant',
          content: replyText,
          intent: 'feedback_response'
        }]);

        sendWhatsAppMessage(phone, replyText, user.settings).catch(console.error);
        return replyText;
      }
    }
    // --- FIM DA LÓGICA DE FEEDBACK ---

    const agentName = user.settings?.agent_name || 'Brazeo.IA';
    const agentTone = user.settings?.agent_tone || 'friendly';
    const agentInstructions = user.settings?.agent_instructions ? `Regras Adicionais de Comportamento:\n${user.settings.agent_instructions}\n\n` : '';

    // Extrai as informações de memória (perfil do usuário) salvas no banco de dados
    const userProfile = user.preferences?.perfil && Array.isArray(user.preferences.perfil) && user.preferences.perfil.length > 0 
      ? `\n[MEMÓRIA DE LONGO PRAZO DO USUÁRIO]\nVocê já sabe as seguintes informações sobre este usuário:\n${user.preferences.perfil.map((p: string) => `- ${p}`).join('\n')}\nUse essas informações para personalizar seu atendimento e não pergunte novamente o que você já sabe.\n` 
      : '';

    const localizacaoUsuario = user.cidade
      ? `\n[LOCALIZAÇÃO DO USUÁRIO]\nCidade: ${user.cidade}${user.bairro ? ', Bairro: ' + user.bairro : ''}\nUse essa informação para personalizar recomendações de lugares, eventos e cinema próximos ao usuário.`
      : '';

    // Busca na Base de Conhecimento RAG (FAQ, Manuais da Empresa)
    const openaiApiKey = user.settings?.openai_api_key || process.env.OPENAI_API_KEY;
    const knowledgeContext = await searchKnowledgeBase(contentString, openaiApiKey as string, supabase);

    const memorias = await recuperarMemoriasRelevantes(user.id, 8);
    const blocoMemoria = memorias.length > 0
      ? `\n\nO QUE VOCÊ JÁ SABE SOBRE ESTE USUÁRIO (use naturalmente na conversa):\n${memorias.join('\n')}`
      : '';

    const systemPrompt = `Você é o ${agentName}, um assistente virtual inteligente atendendo via WhatsApp.
O seu tom de resposta deve ser estritamente: ${agentTone}.
${agentTone === 'fun' ? 'Use emojis frequentemente e seja muito divertido.' : agentTone === 'formal' ? 'Seja muito educado, sério, use pronomes de tratamento e evite gírias.' : agentTone === 'sales' ? 'Seja persuasivo, foque nos benefícios, crie senso de urgência e seja um ótimo vendedor.' : 'Seja amigável, direto e conciso. Use emojis moderadamente.'}

Quando o usuário enviar um link (URL), você receberá o conteúdo da página. Resuma em 3-5 pontos principais de forma clara. Se for um artigo, destaque as ideias centrais. Se for um produto, destaque preço e características principais.

Ao longo da conversa, observe sinais de como o usuário está se sentindo. Se detectar frustração, tristeza, estresse ou esgotamento em 2 ou mais mensagens consecutivas, use a tool registrar_humor para salvar o estado emocional detectado. Responda com empatia antes de qualquer outra coisa.

${agentInstructions}${userProfile}${localizacaoUsuario}${knowledgeContext}
A data e hora atual é: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' })} (horário de Brasília, UTC-3)

IMPORTANTE: Todos os horários mencionados pelo usuário estão em horário de Brasília (UTC-3). Ao usar a ferramenta criar_lembrete, converta SEMPRE o horário do usuário para UTC somando 3 horas. Exemplo: se o usuário disse "14h", o scheduled_at deve ser "17:00:00Z".

Seu objetivo é ajudar o usuário da melhor forma possível, utilizando as ferramentas disponíveis quando necessário.
Nunca saia do seu personagem.` + blocoMemoria;

    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    // Inject history
    filteredHistory.forEach((m, index) => {
      // Map database roles to OpenAI roles. If unknown, default to 'user'
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      if (m.id === userMessageId && role === 'user' && Array.isArray(content)) {
        messages.push({ role, content: content });
      } else {
        messages.push({ role, content: m.content });
      }
    });

    messages.push({ role: 'user', content: content });

    const tools = [
      {
        type: 'function',
        function: {
          name: 'criar_lembrete',
          description: 'Cria e agenda um lembrete ou tarefa para o usuário. Use isso sempre que o usuário pedir para ser lembrado de algo, agendar um compromisso ou criar uma tarefa.',
          parameters: {
            type: 'object',
            properties: {
              task: { type: 'string', description: 'A descrição detalhada da tarefa ou lembrete.' },
              scheduled_at: { type: 'string', description: `A data e hora do lembrete em formato ISO 8601 (ex: 2026-04-05T15:00:00Z). Calcule isso com base na data atual.` },
              recurrence: { type: 'string', enum: ['daily', 'weekly'], description: 'A recorrência do lembrete, apenas se o usuário especificar explicitamente.' }
            },
            required: ['task', 'scheduled_at']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'transcrever_audio',
          description: 'Transcreve um áudio enviado pelo usuário via WhatsApp usando o modelo Whisper. Use quando o usuário enviar uma mensagem de voz.',
          parameters: {
            type: 'object',
            properties: {
              audio_url: { type: 'string', description: 'URL do arquivo de áudio enviado pelo usuário.' }
            },
            required: ['audio_url']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'criar_missao',
          description: 'Cria uma missão de longo prazo com objetivo claro e prazo definido. Use quando o usuário quiser se comprometer com uma meta de 30, 60 ou 90 dias.',
          parameters: {
            type: 'object',
            properties: {
              titulo: { type: 'string', description: 'Título curto da missão.' },
              objetivo: { type: 'string', description: 'Objetivo claro e mensurável da missão.' },
              prazo_dias: { type: 'number', enum: [30, 60, 90], description: 'Prazo da missão em dias (30, 60 ou 90).' },
              tarefas_diarias: { type: 'string', description: 'O que fazer todo dia para avançar na missão.' }
            },
            required: ['titulo', 'objetivo', 'prazo_dias', 'tarefas_diarias']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'criar_habito',
          description: 'Cria um hábito recorrente com lembrete em um horário fixo. Use quando o usuário quiser criar um hábito diário ou semanal e receber lembretes.',
          parameters: {
            type: 'object',
            properties: {
              nome: { type: 'string', description: 'Nome do hábito (ex: "Beber água", "Ler 10 páginas").' },
              frequencia: { type: 'string', enum: ['daily', 'weekly'], description: 'Frequência do hábito.' },
              horario_lembrete: { type: 'string', description: 'Horário do lembrete no formato HH:MM (ex: 08:00).' }
            },
            required: ['nome', 'frequencia', 'horario_lembrete']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'confirmar_habito',
          description: 'Registra o check-in de um hábito e atualiza o streak. Use quando o usuário disser que fez o hábito hoje. Inferir o nome do hábito pelo contexto da conversa e enviar em habit_nome.',
          parameters: {
            type: 'object',
            properties: {
              habit_nome: { type: 'string', description: 'Nome ou descrição do hábito que o usuário está confirmando. Ex: corrida, leitura, beber água.' }
            },
            required: ['habit_nome']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'registrar_humor',
          description: 'Registra o estado emocional percebido do usuário. Use discretamente quando identificar padrões de humor ao longo da conversa.',
          parameters: {
            type: 'object',
            properties: {
              humor: { type: 'string', enum: ['otimo', 'bem', 'neutro', 'estressado', 'triste', 'frustrado'], description: 'Humor percebido do usuário.' }
            },
            required: ['humor']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'iniciar_foco',
          description: 'Ativa o modo foco por X minutos. O agente bloqueará conversas não urgentes durante esse período.',
          parameters: {
            type: 'object',
            properties: {
              minutos: { type: 'number', description: 'Duração do foco em minutos.' },
              tarefa: { type: 'string', description: 'Tarefa que o usuário vai focar.' }
            },
            required: ['minutos', 'tarefa']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'planejar_semana',
          description: 'Retorna a lista de tarefas pendentes do usuário. Use isso quando o usuário pedir para organizar a semana, ver as tarefas da semana ou planejar os próximos dias.',
          parameters: {
            type: 'object',
            properties: {},
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'resumir_texto',
          description: 'Ativa a ferramenta de resumo. Use isso quando o usuário enviar um texto longo e pedir para resumi-lo.',
          parameters: {
            type: 'object',
            properties: {},
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'memorizar_informacao',
          description: 'Salva uma informação importante sobre o usuário (ex: nome, idade, onde mora, filhos, gostos, trabalho, etc) para a memória de longo prazo do assistente. Use isso sempre que o usuário contar um fato relevante sobre si mesmo que possa ser útil no futuro.',
          parameters: {
            type: 'object',
            properties: {
              fato: { type: 'string', description: 'A frase ou fato que descreve a informação do usuário. Ex: "Mora em São Paulo", "Tem 2 cachorros", "Trabalha como programador". Seja claro e conciso.' }
            },
            required: ['fato']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'pesquisar_internet',
          description: 'Pesquisa informações atualizadas na internet em tempo real. Use isso quando o usuário perguntar sobre notícias recentes, clima, cotações, ou qualquer assunto que você não tenha certeza e precise buscar no Google.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'O termo exato que você quer buscar no Google. Seja específico para obter melhores resultados.' }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'resumir_materia',
          description: 'Cria um resumo estruturado em tópicos sobre um assunto escolar ou acadêmico.',
          parameters: {
            type: 'object',
            properties: {
              assunto: { type: 'string', description: 'O tema ou matéria a ser resumido.' },
              nivel: { type: 'string', description: 'O nível de profundidade desejado (ex: médio, faculdade, concurso).' }
            },
            required: ['assunto']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'explicar_assunto',
          description: 'Explica um assunto difícil com linguagem simples, analogias e exemplos práticos.',
          parameters: {
            type: 'object',
            properties: {
              assunto: { type: 'string', description: 'O assunto ou conceito a ser explicado.' }
            },
            required: ['assunto']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'criar_questionario',
          description: 'Cria questões de múltipla escolha (A, B, C, D) para o usuário praticar sobre um assunto.',
          parameters: {
            type: 'object',
            properties: {
              assunto: { type: 'string', description: 'O tema das questões.' },
              quantidade: { type: 'number', description: 'O número de questões a serem criadas.' }
            },
            required: ['assunto']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'plano_estudos',
          description: 'Monta um plano de estudos semanal dividido por dia, com matérias, tempo sugerido e tipo de atividade.',
          parameters: {
            type: 'object',
            properties: {
              materias: { type: 'string', description: 'A lista de matérias ou objetivos que o usuário deseja estudar.' },
              disponibilidade: { type: 'string', description: 'O tempo disponível por dia (ex: 2 horas).' }
            },
            required: ['materias']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'modo_professor',
          description: 'Ativa o modo interativo onde você ensina passo a passo: faz uma pergunta, aguarda a resposta, corrige com explicação e avança apenas quando o aluno entender.',
          parameters: {
            type: 'object',
            properties: {
              assunto: { type: 'string', description: 'O assunto a ser ensinado no modo interativo.' }
            },
            required: ['assunto']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'salvar_aniversario',
          description: 'Salva a data de aniversário do usuário. Use quando o usuário mencionar sua data de nascimento ou aniversário.',
          parameters: {
            type: 'object',
            properties: {
              data_aniversario: { type: 'string', description: 'A data de aniversário no formato MM-DD (ex: 03-15 para 15 de março).' }
            },
            required: ['data_aniversario']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'modo_empreendedor',
          description: 'Ativa o Modo Empreendedor. Use quando o usuário quiser estruturar uma ideia de negócio, validar um modelo, entender seus próximos passos ou pedir um diagnóstico do negócio que já tem.',
          parameters: {
            type: 'object',
            properties: {
              ideia: { type: 'string', description: 'Descrição da ideia ou negócio do usuário.' },
              estagio: { type: 'string', enum: ['ideia', 'validando', 'em_operacao'], description: 'Estágio atual do negócio.' }
            },
            required: ['ideia', 'estagio']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'coach_financeiro',
          description: 'Ativa o Coach Financeiro. Use quando o usuário quiser organizar as finanças, entender para onde o dinheiro vai, sair das dívidas ou montar uma reserva de emergência.',
          parameters: {
            type: 'object',
            properties: {
              renda_mensal: { type: 'number', description: 'Renda mensal do usuário em reais.' },
              gastos_fixos: { type: 'number', description: 'Total de gastos fixos mensais.' },
              dividas: { type: 'string', description: 'Descrição das dívidas atuais.' },
              objetivo: { type: 'string', description: 'Objetivo financeiro principal do usuário.' }
            },
            required: ['renda_mensal', 'gastos_fixos']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'diario_inteligente',
          description: 'Registra o relato do dia ou desabafo do usuário no diário inteligente. Use quando o usuário quiser registrar como foi seu dia, contar o que aconteceu ou expressar sentimentos sobre eventos recentes.',
          parameters: {
            type: 'object',
            properties: {
              relato: { type: 'string', description: 'O relato ou desabafo do usuário sobre o dia.' },
              humor_percebido: { type: 'string', enum: ['otimo', 'bem', 'neutro', 'estressado', 'triste', 'frustrado'], description: 'Humor detectado pelo LLM no relato.' }
            },
            required: ['relato', 'humor_percebido']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'modo_negociacao',
          description: 'Ativa o Modo Negociação. Use quando o usuário precisar se preparar para uma negociação — pedir aumento, fechar contrato, comprar algo importante ou resolver um conflito.',
          parameters: {
            type: 'object',
            properties: {
              situacao: { type: 'string', description: 'Descrição da negociação que o usuário vai enfrentar.' },
              objetivo_usuario: { type: 'string', description: 'O que o usuário quer conquistar nessa negociação.' },
              contexto: { type: 'string', description: 'Informações adicionais como a outra parte envolvida, histórico ou limitações.' }
            },
            required: ['situacao', 'objetivo_usuario']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'revisor_texto',
          description: 'Revisa e melhora qualquer texto enviado pelo usuário. Use quando o usuário pedir para melhorar, corrigir, reescrever ou profissionalizar um e-mail, mensagem, proposta, currículo ou post.',
          parameters: {
            type: 'object',
            properties: {
              texto: { type: 'string', description: 'O texto original que o usuário quer revisar.' },
              tom: { type: 'string', enum: ['formal', 'amigavel', 'persuasivo', 'vendas', 'direto'], description: 'O tom desejado para o texto revisado.' },
              tipo: { type: 'string', description: 'Tipo do texto (ex: e-mail, proposta, currículo, post, mensagem).' }
            },
            required: ['texto', 'tom']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'simulador_decisao',
          description: 'Ajuda o usuário a tomar uma decisão difícil usando frameworks estruturados. Use quando o usuário estiver em dúvida entre opções importantes como mudar de emprego, abrir um negócio, fazer uma compra grande ou escolher um caminho de vida.',
          parameters: {
            type: 'object',
            properties: {
              decisao: { type: 'string', description: 'Descrição da decisão que o usuário precisa tomar.' },
              opcoes: { type: 'string', description: 'As opções que o usuário está considerando.' },
              prazo: { type: 'string', description: 'Quando o usuário precisa decidir.' }
            },
            required: ['decisao', 'opcoes']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'foco_semanal',
          description: 'Registra o objetivo principal e as 3 prioridades da semana do usuário. Use quando o usuário quiser definir o foco da semana, revisar o que foi cumprido ou planejar os próximos dias de forma intencional.',
          parameters: {
            type: 'object',
            properties: {
              objetivo_semana: { type: 'string', description: 'O objetivo principal da semana.' },
              prioridades: { type: 'string', description: 'As 3 principais tarefas ou prioridades da semana separadas por vírgula.' },
              pendencias_semana_anterior: { type: 'string', description: 'O que ficou pendente da semana passada.' }
            },
            required: ['objetivo_semana', 'prioridades']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'explorar_cidade',
          description: 'Busca recomendações de lugares, restaurantes, eventos, shows, cinema e atrações na cidade do usuário. Use quando o usuário mencionar que quer sair, estiver entediado, quiser uma sugestão de programa, perguntar sobre o que tem perto dele, quiser saber o cartaz do cinema, eventos no fim de semana, shows, bares, restaurantes ou qualquer atração local. Também use de forma proativa quando o contexto indicar que o usuário tem tempo livre.',
          parameters: {
            type: 'object',
            properties: {
              categoria: { type: 'string', enum: ['restaurante', 'cinema', 'evento', 'show', 'bar', 'atração', 'startup', 'geral'], description: 'Categoria do que o usuário quer encontrar. Use geral quando o usuário não especificou o tipo.' },
              preferencia: { type: 'string', description: 'Preferência específica do usuário dentro da categoria. Exemplos: pizza, rock, comédia, tecnologia, samba, filme de ação.' },
              quando: { type: 'string', enum: ['hoje', 'amanha', 'fim_de_semana', 'essa_semana'], description: 'Quando o usuário quer ir ou o evento acontece. Preencha apenas se o usuário mencionou um período.' },
              raio_km: { type: 'number', description: 'Raio máximo de distância em km para a busca. Se o usuário mencionar uma distância específica, use esse valor.' }
            },
            required: ['categoria']
          }
        }
      }
    ];

    // 3. First Call to LLM with Tools
    const routeFirst = routeModel(contentString);
    const response = await openai.chat.completions.create({
      model: routeFirst.model,
      messages: messages,
      tools: tools as any,
      tool_choice: 'auto',
    });

    console.log(`[MODEL ROUTER] tier=${routeFirst.tier} reason=${routeFirst.reason} model=${routeFirst.model}`);

    const responseMessage = response.choices[0].message;
    let replyText = responseMessage.content || '';
    let intent = 'resposta_livre';

    // 4. Handle Tool Calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);
      
      let routeSecond = routeModel(contentString);
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;
        
        const functionName = toolCall.function.name;
        intent = functionName; // Track the primary intent based on the tool called
        registrarTema(user.id, functionName).catch(() => {});
        routeSecond = routeModel(contentString, functionName);
        
        let functionArgs = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch (e) {
          console.error("Error parsing tool arguments", e);
        }
        
        // Execute the actual function
        const functionResponse = await executeTool(functionName, functionArgs, user);
        
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(functionResponse),
        });
      }
      
      // 5. Second Call to get the final response based on tool results
      const secondResponse = await openai.chat.completions.create({
        model: routeSecond.model,
        messages: messages,
      });
      
      replyText = secondResponse.choices[0].message?.content?.trim() || 'Desculpe, ocorreu um erro ao processar a ferramenta.';
      console.log(`[MODEL ROUTER] second_call tier=${routeSecond.tier} reason=${routeSecond.reason} model=${routeSecond.model}`);
    }

    if (!replyText) {
       replyText = 'Desculpe, não consegui processar sua solicitação agora.';
    }

    // 6. Update Intent & Save Assistant Message
    try {
      if (!isTestMode) {
        if (userMessageId && intent !== 'resposta_livre') {
          await supabase.from('messages').update({ intent }).eq('id', userMessageId);
        }

        await supabase.from('messages').insert([{
          user_id: user.id,
          role: 'assistant',
          content: replyText,
          intent: intent
        }]);
      }
    } catch (e) { /* ignore db error */ }

    // 7. Send via Evolution API (Fire and forget)
    if (!isTestMode) {
      if (usageNotice) {
        replyText = `${replyText}\n\n${usageNotice}`;
      }
      sendWhatsAppMessage(phone, replyText, user.settings).catch(console.error);
    }

    return replyText;

  } catch (error) {
    console.error('Error in agent runner:', error);
    try {
      await supabase.from('agent_logs').insert({
        type: 'error',
        message: (error as any)?.message || String(error),
        context: JSON.stringify({ phone, content: contentString.slice(0, 200) }),
        created_at: new Date().toISOString()
      });
    } catch {}
    return 'Ocorreu um erro interno ao processar sua mensagem.';
  }
}

async function sendWhatsAppMessage(phone: string, text: string, settings: any) {
  const apiUrl = settings?.evolution_api_url || process.env.EVOLUTION_API_URL;
  const apiKey = settings?.evolution_api_key || process.env.EVOLUTION_API_KEY;
  const instance = settings?.evolution_instance_name || process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiUrl || !apiKey || !instance) {
    console.warn('Evolution API credentials not configured. Skipping message send.');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: phone,
        options: {
          delay: 1200,
          presence: 'composing'
        },
        textMessage: {
          text: text
        }
      })
    });
    
    if (!response.ok) {
      console.error('Failed to send WhatsApp message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}
