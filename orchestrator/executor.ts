import { getServiceSupabase } from '@/lib/supabase';

export async function executeTool(name: string, args: any, user: any) {
  switch (name) {
    case 'criar_lembrete':
      return await handleCriarLembrete(user, args);
    case 'planejar_semana':
      return await handlePlanejarSemana(user);
    case 'resumir_texto':
      return await handleResumirTexto();
    case 'memorizar_informacao':
      return await handleMemorizarInformacao(user, args);
    default:
      return { error: 'Ferramenta desconhecida' };
  }
}

async function handleCriarLembrete(user: any, args: any) {
  if (!args.scheduled_at) {
    return { error: 'Horário ausente. Peça ao usuário para especificar quando ele quer ser lembrado.' };
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('reminders').insert([{
    user_id: user.id,
    content: args.task,
    scheduled_at: args.scheduled_at,
    recurrence: args.recurrence || null
  }]).select().single();

  if (error) {
    console.error('Error handling lembrete:', error);
    return { error: `Falha ao salvar no banco: ${error.message}` };
  }

  return { success: true, reminder: data, instruction: 'Confirme para o usuário que o lembrete foi agendado com sucesso e informe o horário.' };
}

async function handlePlanejarSemana(user: any) {
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
    instruction: 'Organize as tarefas pendentes listadas acima em um plano semanal (Seg a Sex). Se o usuário enviou novas tarefas, inclua-as também.'
  };
}

async function handleResumirTexto() {
  return {
    success: true,
    instruction: 'Resuma o texto fornecido pelo usuário em 3 a 5 pontos principais, usando linguagem simples e direta.'
  };
}

async function handleMemorizarInformacao(user: any, args: any) {
  if (!args.fato) {
    return { error: 'Nenhum fato fornecido para memorizar.' };
  }

  const supabase = getServiceSupabase();
  
  // Extrai as preferências atuais ou cria um novo objeto
  const prefs = user.preferences || {};
  const perfil = prefs.perfil || [];
  
  // Evita duplicatas exatas
  if (!perfil.includes(args.fato)) {
    perfil.push(args.fato);
  }
  
  prefs.perfil = perfil;
  
  const { error } = await supabase
    .from('users')
    .update({ preferences: prefs })
    .eq('id', user.id);
    
  if (error) {
    console.error('Error updating profile:', error);
    return { error: `Falha ao salvar a informação no banco de dados: ${error.message}` };
  }
  
  return { 
    success: true, 
    instruction: `A informação "${args.fato}" foi salva com sucesso na sua memória de longo prazo. Você pode usar isso nas próximas interações. Agradeça ao usuário por compartilhar ou confirme de forma sutil que você se lembrará disso.` 
  };
}
