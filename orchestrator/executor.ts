import { getServiceSupabase } from '@/lib/supabase';

export async function executeTool(name: string, args: any, user: any) {
  switch (name) {
    case 'criar_lembrete':
      return await handleCriarLembrete(user, args);
    case 'transcrever_audio':
      return await handleTranscreverAudio(user, args);
    case 'criar_missao':
      return await handleCriarMissao(user, args);
    case 'criar_habito':
      return await handleCriarHabito(user, args);
    case 'confirmar_habito':
      return await handleConfirmarHabito(user, args);
    case 'registrar_humor':
      return await handleRegistrarHumor(user, args);
    case 'iniciar_foco':
      return await handleIniciarFoco(user, args);
    case 'planejar_semana':
      return await handlePlanejarSemana(user);
    case 'resumir_texto':
      return await handleResumirTexto();
    case 'memorizar_informacao':
      return await handleMemorizarInformacao(user, args);
    case 'pesquisar_internet':
      return await handlePesquisarInternet(user, args);
    case 'resumir_materia':
      return await handleResumirMateria(args);
    case 'explicar_assunto':
      return await handleExplicarAssunto(args);
    case 'criar_questionario':
      return await handleCriarQuestionario(args);
    case 'plano_estudos':
      return await handlePlanoEstudos(args);
    case 'modo_professor':
      return await handleModoProfessor(args);
    case 'salvar_aniversario':
      return await handleSalvarAniversario(user, args);
    default:
      return { error: 'Ferramenta desconhecida' };
  }
}

async function handleTranscreverAudio(user: any, args: any) {
  if (!args.audio_url) {
    return { error: 'URL do áudio ausente. Peça ao usuário para reenviar o áudio.' };
  }

  const apiKey = user.settings?.openai_api_key || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: 'Transcrição indisponível: a chave da OpenAI não está configurada.' };
  }

  try {
    const audioRes = await fetch(args.audio_url);
    if (!audioRes.ok) {
      return { error: 'Falha ao baixar o áudio para transcrição.' };
    }

    const audioBuffer = await audioRes.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });

    const form = new FormData();
    form.append('file', audioBlob, 'audio.ogg');
    form.append('model', 'whisper-1');
    form.append('language', 'pt');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = data?.error?.message || 'Falha ao transcrever o áudio.';
      return { error: message };
    }

    const transcription = data?.text;
    if (!transcription) {
      return { error: 'Transcrição vazia ou indisponível.' };
    }

    return {
      success: true,
      transcription,
      instruction: 'Use o texto transcrito acima como se fosse a mensagem digitada pelo usuário e responda normalmente ao pedido.',
    };
  } catch (error: any) {
    return { error: `Falha ao transcrever o áudio: ${error.message}` };
  }
}

async function handleCriarMissao(user: any, args: any) {
  if (!args.titulo || !args.objetivo || args.prazo_dias == null) {
    return { error: 'Dados incompletos. Peça ao usuário o título, objetivo e o prazo (30, 60 ou 90 dias).' };
  }

  const prazo = Number(args.prazo_dias);
  if (![30, 60, 90].includes(prazo)) {
    return { error: 'Prazo inválido. O prazo deve ser 30, 60 ou 90 dias.' };
  }

  const supabase = getServiceSupabase();
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + prazo);

  const { data, error } = await supabase
    .from('missions')
    .insert([{
      user_id: user.id,
      titulo: args.titulo,
      objetivo: args.objetivo,
      prazo_dias: prazo,
      tarefas_diarias: args.tarefas_diarias || null,
      ends_at: endsAt.toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating mission:', error);
    return { error: `Falha ao salvar a missão no banco: ${error.message}` };
  }

  return {
    success: true,
    mission: data,
    instruction: 'Confirme para o usuário que a missão foi criada com sucesso, repita o título, o prazo e a tarefa diária, e diga que você vai acompanhar o progresso diariamente às 8h.'
  };
}

async function handleCriarHabito(user: any, args: any) {
  if (!args.nome || !args.frequencia) {
    return { error: 'Dados incompletos. Peça ao usuário o nome do hábito e a frequência (diário ou semanal).' };
  }

  if (!['daily', 'weekly'].includes(args.frequencia)) {
    return { error: "Frequência inválida. Use 'daily' ou 'weekly'." };
  }

  if (args.horario_lembrete && !/^\d{2}:\d{2}$/.test(args.horario_lembrete)) {
    return { error: "Horário inválido. Use o formato HH:MM (ex: 08:00)." };
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('habits')
    .insert([{
      user_id: user.id,
      nome: args.nome,
      frequencia: args.frequencia,
      horario_lembrete: args.horario_lembrete || null
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating habit:', error);
    return { error: `Falha ao salvar o hábito no banco: ${error.message}` };
  }

  return {
    success: true,
    habit: data,
    instruction: 'Confirme para o usuário que o hábito foi criado e explique como ele pode confirmar quando fizer (check-in).'
  };
}

async function handleConfirmarHabito(user: any, args: any) {
  const supabase = getServiceSupabase();
  if (!args.habit_nome) {
    return { error: 'Nome do hábito ausente.' };
  }

  const { data: habits, error: fetchError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (fetchError) {
    return { error: 'Falha ao buscar hábitos ativos.' };
  }

  if (!habits || habits.length === 0) {
    return { error: 'Você não tem hábitos ativos no momento.' };
  }

  const query = String(args.habit_nome).trim().toLowerCase();
  const matchedHabit = habits.find((h: any) => {
    const saved = String(h.nome || '').trim().toLowerCase();
    if (!saved || !query) return false;
    return saved.includes(query) || query.includes(saved);
  });

  if (!matchedHabit) {
    const list = habits.map((h: any) => `- ${h.nome}`).join('\n');
    return { error: `Não encontrei um hábito correspondente. Hábitos ativos:\n${list}` };
  }

  const now = new Date();
  const last = matchedHabit.last_check_in ? new Date(matchedHabit.last_check_in) : null;

  const toUtcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

  let nextStreak = typeof matchedHabit.streak === 'number' ? matchedHabit.streak : 0;

  if (!last) {
    nextStreak = 1;
  } else {
    const diffDays = Math.floor((toUtcDay(now) - toUtcDay(last)) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return { error: 'O check-in de hoje já foi feito para esse hábito.' };
    } else if (diffDays === 1) {
      nextStreak = nextStreak + 1;
    } else {
      nextStreak = 1;
    }
  }

  const { error: updateError } = await supabase
    .from('habits')
    .update({ last_check_in: now.toISOString(), streak: nextStreak })
    .eq('id', matchedHabit.id);

  if (updateError) {
    console.error('Error confirming habit:', updateError);
    return { error: `Falha ao confirmar o hábito: ${updateError.message}` };
  }

  return {
    success: true,
    habit_nome: matchedHabit.nome,
    streak: nextStreak,
    instruction: `Confirme para o usuário que o check-in foi registrado com sucesso e parabenize com entusiasmo pelo streak de ${nextStreak} dias 🔥`
  };
}

async function handleRegistrarHumor(user: any, args: any) {
  if (!args.humor) {
    return { error: 'Humor ausente.' };
  }

  const allowed = ['otimo', 'bem', 'neutro', 'estressado', 'triste', 'frustrado'];
  if (!allowed.includes(args.humor)) {
    return { error: 'Humor inválido.' };
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('mood_logs').insert([{
    user_id: user.id,
    humor: args.humor,
  }]);

  if (error) {
    console.error('Error saving mood log:', error);
    return { error: `Falha ao salvar o humor no banco: ${error.message}` };
  }

  return {
    success: true,
    instruction: 'O humor foi registrado. Responda com empatia e ofereça ajuda prática.'
  };
}

async function handleIniciarFoco(user: any, args: any) {
  const minutos = Number(args.minutos);
  const tarefa = typeof args.tarefa === 'string' ? args.tarefa.trim() : '';

  if (!Number.isFinite(minutos) || minutos <= 0 || !tarefa) {
    return { error: 'Dados inválidos. Peça ao usuário o tempo em minutos e a tarefa do foco.' };
  }

  const supabase = getServiceSupabase();
  const prefs = user.preferences || {};

  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setMinutes(endsAt.getMinutes() + minutos);

  prefs.foco_ativo = {
    tarefa,
    termina_em: endsAt.toISOString(),
    minutos,
  };

  const { error } = await supabase
    .from('users')
    .update({ preferences: prefs })
    .eq('id', user.id);

  if (error) {
    console.error('Error starting focus:', error);
    return { error: `Falha ao ativar o modo foco: ${error.message}` };
  }

  return {
    success: true,
    foco_ativo: prefs.foco_ativo,
    instruction: 'Confirme para o usuário que o modo foco foi iniciado e diga até que horas ele vai ficar focado. Avise que só vai responder mensagens urgentes nesse período.'
  };
}

async function handleResumirMateria(args: any) {
  const nivelStr = args.nivel ? ` adaptado ao nível ${args.nivel}` : '';
  return {
    success: true,
    instruction: `Crie um resumo estruturado em tópicos sobre o assunto solicitado${nivelStr}. Adapte a profundidade e a linguagem para o nível educacional especificado. Organize com títulos, subtópicos e destaque as palavras-chave.`
  };
}

async function handleExplicarAssunto(args: any) {
  return {
    success: true,
    instruction: 'Explique o assunto de forma extremamente simples e didática. Utilize analogias do dia a dia e exemplos práticos. Se o usuário estiver afirmando que não entendeu uma explicação anterior, tente uma abordagem ou analogia completamente diferente.'
  };
}

async function handleCriarQuestionario(args: any) {
  return {
    success: true,
    instruction: 'Crie um questionário com a quantidade solicitada de perguntas de múltipla escolha (A, B, C, D) sobre o assunto. Se o usuário estiver respondendo a um questionário anterior, corrija as respostas, parabenize os acertos e explique detalhadamente o porquê dos erros.'
  };
}

async function handlePlanoEstudos(args: any) {
  return {
    success: true,
    instruction: 'Crie um cronograma semanal de estudos (Segunda a Sexta/Domingo) distribuindo as matérias fornecidas. Para cada dia, inclua o tempo sugerido e intercale tipos de atividade (leitura, exercícios, revisão). Mantenha o cronograma realista e equilibrado.'
  };
}

async function handleModoProfessor(args: any) {
  return {
    success: true,
    instruction: 'Inicie ou continue o Modo Professor. Faça apenas UMA pergunta ou ensine UM conceito por vez. Aguarde a resposta do aluno. Ao receber a resposta, valide, explique o conceito se necessário e só avance para a próxima etapa se o aluno demonstrar compreensão. Mantenha o tom muito encorajador e paciente.'
  };
}

async function handleSalvarAniversario(user: any, args: any) {
  if (!args.data_aniversario) {
    return { error: 'Data de aniversário não fornecida.' };
  }

  const supabase = getServiceSupabase();
  const prefs = user.preferences || {};
  prefs.aniversario = args.data_aniversario;

  const { error } = await supabase
    .from('users')
    .update({ preferences: prefs })
    .eq('id', user.id);

  if (error) {
    console.error('Error saving birthday:', error);
    return { error: `Falha ao salvar a data de aniversário no banco de dados: ${error.message}` };
  }

  return {
    success: true,
    instruction: 'A data de aniversário foi salva com sucesso. Agradeça ao usuário e pergunte como pode ajudá-lo hoje.'
  };
}

async function handlePesquisarInternet(user: any, args: any) {
  if (!args.query) {
    return { error: 'Nenhum termo de pesquisa fornecido.' };
  }

  const apiKey = user.settings?.tavily_api_key || process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return { 
      error: 'A chave da API do Tavily não está configurada no painel. Avise o usuário que você não pode acessar a internet no momento.' 
    };
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: args.query,
        search_depth: "basic",
        include_answer: true,
        include_images: false,
        include_raw_content: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      query: args.query,
      answer: data.answer,
      results: data.results.map((r: any) => ({ title: r.title, content: r.content, url: r.url })),
      instruction: 'Use os resultados e o resumo acima para responder à pergunta do usuário de forma clara e natural. Se os resultados não forem úteis, diga que pesquisou mas não encontrou uma resposta exata.'
    };
  } catch (error: any) {
    console.error('Error searching internet:', error);
    return { error: `Falha ao pesquisar na internet: ${error.message}` };
  }
}

async function handleCriarLembrete(user: any, args: any) {
  if (!args.scheduled_at) {
    return { error: 'Horário ausente. Peça ao usuário para especificar quando ele quer ser lembrado.' };
  }

  const scheduledAtBrt = new Date(args.scheduled_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', timeStyle: 'short' });

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

  return { success: true, reminder: data, instruction: `Confirme para o usuário que o lembrete foi agendado com sucesso e informe o horário (${scheduledAtBrt}).` };
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
