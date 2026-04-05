import { getServiceSupabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { executeDirective } from './executor';

// Initialize OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key-for-build',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', // Optional, for including your app on openrouter.ai rankings.
    'X-Title': 'Brazeo.IA', // Optional. Shows in rankings on openrouter.ai.
  }
});

export async function runAgent(phone: string, content: string): Promise<string> {
  const supabase = getServiceSupabase();
  let user: any = { id: 'mock-user-id', status: 'active', phone };
  let formattedHistory = '';

  try {
    // 1. Identify User
    let { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // User not found, create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ phone, status: 'active' }])
        .select()
        .single();
        
      if (!createError) user = newUser;
    } else if (!userError && dbUser) {
      user = dbUser;
    }

    if (user.status !== 'active') {
      console.log(`User ${phone} is not active. Status: ${user.status}`);
      return 'Sua conta está inativa no momento.';
    }

    // Update last seen
    await supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);

    // Save user message
    await supabase.from('messages').insert([{
      user_id: user.id,
      role: 'user',
      content: content
    }]);

    // 2. Load Context (last 10 messages)
    const { data: history } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (history) {
      formattedHistory = history.reverse().map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');
    }
    
    // Load agent settings
    const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (settings) {
      user.settings = settings;
    }
  } catch (error) {
    console.warn('Supabase is not configured or failed. Running in memory mode.', error);
  }

  try {
    // 3. Intent Classification via Gemini
    const systemPrompt = `Você é o orquestrador do Brazeo.IA.
Sua função é analisar a mensagem do usuário e classificar a intenção em uma das seguintes categorias:
- criar_lembrete: O usuário quer ser lembrado de algo, agendar uma tarefa ou aviso.
- planejar_semana: O usuário quer organizar a semana ou listar tarefas para a semana.
- resumir_texto: O usuário enviou um texto longo e quer um resumo.
- consultor_rapido: O usuário está fazendo uma pergunta prática, pedindo conselho, cálculo, etc.
- resposta_livre: Qualquer outra interação, saudação, ou conversa geral.

Histórico recente:
${formattedHistory}

Mensagem atual do usuário: "${content}"

Responda APENAS com o nome da intenção (ex: criar_lembrete).`;

    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: systemPrompt }],
      temperature: 0.1,
    });

    const intent = response.choices[0].message?.content?.trim().toLowerCase() || 'resposta_livre';
    
    try {
      // Update the message with the classified intent
      await supabase.from('messages')
        .update({ intent })
        .eq('user_id', user.id)
        .eq('content', content)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (e) { /* ignore db error */ }

    // 4 & 5. Execute Directive
    const result = await executeDirective(intent, user, content, formattedHistory);

    // 6. Generate Final Response
    const agentName = user.settings?.agent_name || 'Brazeo.IA';
    const agentTone = user.settings?.agent_tone || 'friendly';
    const agentInstructions = user.settings?.agent_instructions ? `Regras Adicionais de Comportamento:\n${user.settings.agent_instructions}\n\n` : '';

    const responsePrompt = `Você é o ${agentName}, um assistente virtual inteligente atendendo via WhatsApp.
O seu tom de resposta deve ser estritamente: ${agentTone}.
${agentTone === 'fun' ? 'Use emojis frequentemente e seja muito divertido.' : agentTone === 'formal' ? 'Seja muito educado, sério, use pronomes de tratamento e evite gírias.' : agentTone === 'sales' ? 'Seja persuasivo, foque nos benefícios, crie senso de urgência e seja um ótimo vendedor.' : 'Seja amigável, direto e conciso. Use emojis moderadamente.'}

${agentInstructions}
Intenção identificada na mensagem do cliente: ${intent}
Resultado da execução (dados de sistema): ${JSON.stringify(result)}

Mensagem atual do usuário: "${content}"

Gere a resposta final para enviar ao usuário no WhatsApp. Nunca saia do seu personagem.`;

    const finalResponse = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: responsePrompt }],
    });

    const replyText = finalResponse.choices[0].message?.content?.trim() || 'Desculpe, não consegui processar sua solicitação agora.';

    try {
      // Save assistant message
      await supabase.from('messages').insert([{
        user_id: user.id,
        role: 'assistant',
        content: replyText,
        intent: intent
      }]);
    } catch (e) { /* ignore db error */ }

    // 7. Send via Evolution API (Fire and forget)
    sendWhatsAppMessage(phone, replyText).catch(console.error);

    return replyText;

  } catch (error) {
    console.error('Error in agent runner:', error);
    return 'Ocorreu um erro interno ao processar sua mensagem.';
  }
}

async function sendWhatsAppMessage(phone: string, text: string) {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

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
