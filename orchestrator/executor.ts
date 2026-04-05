import { getServiceSupabase } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', // Optional
    'X-Title': 'Brazeo.IA', // Optional
  }
});

export async function executeDirective(intent: string, user: any, content: string, history: string) {
  switch (intent) {
    case 'criar_lembrete':
      return await handleCriarLembrete(user, content);
    case 'planejar_semana':
      return await handlePlanejarSemana(user, content);
    case 'resumir_texto':
      return await handleResumirTexto(content);
    case 'consultor_rapido':
    case 'resposta_livre':
    default:
      return { status: 'handled_by_llm' };
  }
}

async function handleCriarLembrete(user: any, content: string) {
  // Extract details using Gemini
  const prompt = `Extraia os detalhes do lembrete da seguinte mensagem.
Mensagem: "${content}"

Responda em formato JSON estrito com as seguintes chaves:
- task: A descrição da tarefa ou lembrete.
- scheduled_at: A data e hora em formato ISO 8601 (ex: 2026-04-05T15:00:00Z). Se não houver horário claro, retorne null. Considere que hoje é ${new Date().toISOString()}.
- recurrence: 'daily', 'weekly', ou null.

Apenas o JSON, sem markdown.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    let jsonStr = response.choices[0].message?.content?.trim() || '{}';
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    }
    
    const details = JSON.parse(jsonStr);

    if (!details.scheduled_at) {
      return { error: 'missing_time', task: details.task };
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase.from('reminders').insert([{
      user_id: user.id,
      content: details.task,
      scheduled_at: details.scheduled_at,
      recurrence: details.recurrence
    }]).select().single();

    if (error) throw error;

    return { success: true, reminder: data };
  } catch (error) {
    console.error('Error handling lembrete:', error);
    return { error: 'failed_to_parse_or_save' };
  }
}

async function handlePlanejarSemana(user: any, content: string) {
  const supabase = getServiceSupabase();
  
  // Get pending tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('done', false);

  return { 
    success: true, 
    pending_tasks: tasks || [],
    instruction: 'Organize as tarefas pendentes e as novas tarefas mencionadas pelo usuário em um plano semanal (Seg a Sex).'
  };
}

async function handleResumirTexto(content: string) {
  return {
    success: true,
    instruction: 'Resuma o texto fornecido em 3 a 5 pontos principais, usando linguagem simples e direta.'
  };
}
