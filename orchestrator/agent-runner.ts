import { getServiceSupabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { executeTool } from './executor';

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

const DAILY_MESSAGE_LIMIT = 50;

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
  let userMessageId: string | null = null;

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

      const todayUtc = new Date().toISOString().slice(0, 10);
      const prefs = user.preferences || {};
      if (prefs.data_contagem !== todayUtc) {
        prefs.msgs_hoje = 0;
        prefs.data_contagem = todayUtc;
      }

      const msgsHoje = typeof prefs.msgs_hoje === 'number' ? prefs.msgs_hoje : 0;
      if (msgsHoje >= DAILY_MESSAGE_LIMIT) {
        const limitMsg = "Você atingiu o limite de 50 mensagens por hoje. 😊\nSeu limite renova à meia-noite. Até lá!";
        sendWhatsAppMessage(phone, limitMsg, user.settings).catch(console.error);
        return limitMsg;
      }

      prefs.msgs_hoje = msgsHoje + 1;
      user.preferences = prefs;
      await supabase.from('users').update({ preferences: prefs }).eq('id', user.id);

      // Update last seen
      await supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);

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
        .limit(10);
        
      if (historyData) {
        history = historyData.reverse();
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
  }

  try {
    const openai = createOpenAIClient(user.settings?.openrouter_api_key);
    
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

    // --- LÓGICA DE FEEDBACK ---
    const trimmedContent = contentString.trim();
    if (['1', '2', '3'].includes(trimmedContent)) {
      const lastAssistantMessage = history.find(m => m.role === 'assistant');
      if (lastAssistantMessage && lastAssistantMessage.content.includes('Como estou indo até agora?')) {
        
        await supabase.from('feedbacks').insert([{
          user_id: user.id,
          score: parseInt(trimmedContent)
        }]);

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

    // Busca na Base de Conhecimento RAG (FAQ, Manuais da Empresa)
    const openaiApiKey = user.settings?.openai_api_key || process.env.OPENAI_API_KEY;
    const knowledgeContext = await searchKnowledgeBase(contentString, openaiApiKey as string, supabase);

    const systemPrompt = `Você é o ${agentName}, um assistente virtual inteligente atendendo via WhatsApp.
O seu tom de resposta deve ser estritamente: ${agentTone}.
${agentTone === 'fun' ? 'Use emojis frequentemente e seja muito divertido.' : agentTone === 'formal' ? 'Seja muito educado, sério, use pronomes de tratamento e evite gírias.' : agentTone === 'sales' ? 'Seja persuasivo, foque nos benefícios, crie senso de urgência e seja um ótimo vendedor.' : 'Seja amigável, direto e conciso. Use emojis moderadamente.'}

${agentInstructions}${userProfile}${knowledgeContext}
A data e hora atual é: ${new Date().toISOString()}

Seu objetivo é ajudar o usuário da melhor forma possível, utilizando as ferramentas disponíveis quando necessário.
Nunca saia do seu personagem.`;

    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    // Inject history (which already includes the current message since we fetched it after inserting)
    history.forEach((m, index) => {
      // Map database roles to OpenAI roles. If unknown, default to 'user'
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      if (index === history.length - 1 && role === 'user' && Array.isArray(content)) {
        messages.push({ role, content: content });
      } else {
        messages.push({ role, content: m.content });
      }
    });

    // If for some reason history is empty, push the current message
    if (history.length === 0) {
      messages.push({ role: 'user', content: content });
    }

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
      }
    ];

    // 3. First Call to LLM with Tools
    const response = await openai.chat.completions.create({
      model: 'anthropic/claude-haiku-4-5',
      messages: messages,
      tools: tools as any,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;
    let replyText = responseMessage.content || '';
    let intent = 'resposta_livre';

    // 4. Handle Tool Calls
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);
      
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;
        
        const functionName = toolCall.function.name;
        intent = functionName; // Track the primary intent based on the tool called
        
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
        model: 'anthropic/claude-haiku-4-5',
        messages: messages,
      });
      
      replyText = secondResponse.choices[0].message?.content?.trim() || 'Desculpe, ocorreu um erro ao processar a ferramenta.';
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
      sendWhatsAppMessage(phone, replyText, user.settings).catch(console.error);
    }

    return replyText;

  } catch (error) {
    console.error('Error in agent runner:', error);
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
