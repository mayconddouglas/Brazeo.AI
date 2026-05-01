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
    case 'modo_empreendedor':
      return await handleModoEmpreendedor(user, args);
    case 'coach_financeiro':
      return await handleCoachFinanceiro(user, args);
    case 'diario_inteligente':
      return await handleDiarioInteligente(user, args);
    case 'modo_negociacao':
      return await handleModoNegociacao(user, args);
    case 'revisor_texto':
      return await handleRevisorTexto(user, args);
    case 'simulador_decisao':
      return await handleSimuladorDecisao(user, args);
    case 'foco_semanal':
      return await handleFocoSemanal(user, args);
    case 'explorar_cidade':
      return await handleExplorarCidade(user, args);
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

async function handleModoEmpreendedor(user: any, args: any) {
  if (!args.ideia || !args.estagio) {
    return { error: 'Dados incompletos. Peça ao usuário a descrição da ideia e o estágio atual (ideia, validando, em_operacao).' };
  }

  try {
    const supabase = getServiceSupabase();
    await supabase.from('entrepreneur_sessions').insert([{
      user_id: user.id,
      ideia: args.ideia,
      estagio: args.estagio,
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.error('Error saving entrepreneur session:', e);
  }

  return {
    success: true,
    instruction: `Você é um consultor de negócios experiente e direto. O usuário está\nno estágio ${args.estagio} com a seguinte ideia: ${args.ideia}.\n\nMonte um diagnóstico completo estruturado em 5 blocos:\n\n1. VALIDAÇÃO DA IDEIA — A ideia faz sentido de mercado? Qual o problema\nque resolve? Existe demanda real?\n\n2. MODELO DE NEGÓCIO — Como vai ganhar dinheiro? Quais as fontes de receita\npossíveis? Qual o ticket médio estimado?\n\n3. PÚBLICO-ALVO — Quem é o cliente ideal? Onde encontrá-lo? Qual a dor\nprincipal que esse cliente tem?\n\n4. RISCOS PRINCIPAIS — Quais os 3 maiores riscos dessa ideia? O que pode\ndar errado nos primeiros 90 dias?\n\n5. PRIMEIROS PASSOS — Liste 5 ações concretas que o usuário pode fazer\nesta semana para avançar. Seja extremamente específico e prático.\n\nFinalize perguntando em qual bloco o usuário quer se aprofundar.`
  };
}

async function handleCoachFinanceiro(user: any, args: any) {
  const rendaMensal = Number(args.renda_mensal);
  const gastosFixos = Number(args.gastos_fixos);

  if (!Number.isFinite(rendaMensal) || !Number.isFinite(gastosFixos) || rendaMensal <= 0 || gastosFixos < 0) {
    return { error: 'Dados inválidos. Peça ao usuário a renda mensal e os gastos fixos mensais (valores positivos).' };
  }

  const sobra = rendaMensal - gastosFixos;
  const percentualComprometido = (gastosFixos / rendaMensal) * 100;

  const dividas = args.dividas ? String(args.dividas) : 'Nenhuma informada';
  const objetivo = args.objetivo ? String(args.objetivo) : 'Não informado';

  try {
    const supabase = getServiceSupabase();
    await supabase.from('financial_sessions').insert([{
      user_id: user.id,
      renda_mensal: rendaMensal,
      gastos_fixos: gastosFixos,
      dividas: args.dividas || null,
      objetivo: args.objetivo || null,
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.error('Error saving financial session:', e);
  }

  return {
    success: true,
    instruction: `Você é um coach financeiro especialista em finanças pessoais para\nbrasileiros de renda média. Analise a situação abaixo e monte um\nplano de ação completo.\n\nSITUAÇÃO FINANCEIRA:\n- Renda mensal: R$ ${rendaMensal}\n- Gastos fixos: R$ ${gastosFixos}\n- Sobra mensal: R$ ${sobra}\n- Percentual comprometido: ${percentualComprometido.toFixed(1)}%\n- Dívidas: ${dividas}\n- Objetivo: ${objetivo}\n\nMonte o diagnóstico em 4 blocos:\n\n1. DIAGNÓSTICO — Como está a saúde financeira? O percentual comprometido\né saudável? (ideal é abaixo de 70%)\n\n2. ONDE ESTÁ SANGRANDO — Com base nos gastos fixos e dívidas, identifique\nonde o dinheiro está sendo desperdiçado ou mal alocado.\n\n3. PLANO DE AÇÃO — 3 ações concretas para os próximos 30 dias para melhorar\na situação. Seja muito específico com valores e prazos.\n\n4. META DE RESERVA — Quanto o usuário deveria ter de reserva de emergência\n(6x os gastos fixos) e quanto tempo levaria para chegar lá com a sobra atual.\n\nUse linguagem simples, direta e empática. Evite jargões financeiros.`
  };
}

async function handleDiarioInteligente(user: any, args: any) {
  if (!args.relato || !args.humor_percebido) {
    return { error: 'Dados incompletos. Peça ao usuário o relato e registre o humor percebido.' };
  }

  try {
    const supabase = getServiceSupabase();
    await supabase.from('diary_entries').insert([{
      user_id: user.id,
      relato: args.relato,
      humor: args.humor_percebido,
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.error('Error saving diary entry:', e);
  }

  try {
    const supabase = getServiceSupabase();
    await supabase.from('mood_logs').insert([{
      user_id: user.id,
      humor: args.humor_percebido,
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.error('Error saving mood log from diary:', e);
  }

  return {
    success: true,
    instruction: `O usuário acabou de registrar uma entrada no diário. Humor detectado:\n${args.humor_percebido}.\n\nResponda de forma empática e acolhedora, reconhecendo o que o usuário\ncompartilhou. Depois faça UMA das seguintes ações dependendo do humor:\n\n- Se otimo ou bem: celebre com ele e pergunte o que contribuiu para\n  esse dia positivo.\n- Se neutro: reconheça e pergunte o que poderia ter tornado o dia melhor.\n- Se estressado, triste ou frustrado: valide o sentimento sem minimizar,\n  ofereça uma perspectiva gentil e pergunte se quer desabafar mais ou\n  prefere uma sugestão prática para aliviar o peso.\n\nNão dê conselhos não solicitados. Seja presente e humano.`
  };
}

async function handleModoNegociacao(user: any, args: any) {
  if (!args.situacao || !args.objetivo_usuario) {
    return { error: 'Dados incompletos. Peça ao usuário a descrição da situação e o objetivo na negociação.' };
  }

  const contexto = args.contexto ? String(args.contexto) : 'Nenhum';

  return {
    success: true,
    instruction: `Você é um especialista em negociação com base em Harvard e CNV\n(Comunicação Não-Violenta). Prepare o usuário para a seguinte negociação:\n\nSITUAÇÃO: ${args.situacao}\nOBJETIVO DO USUÁRIO: ${args.objetivo_usuario}\nCONTEXTO ADICIONAL: ${contexto}\n\nMonte o guia de negociação em 5 blocos:\n\n1. ANÁLISE DA SITUAÇÃO — Quem tem mais poder nessa negociação? Quais\nsão os interesses reais de cada lado (não apenas as posições)?\n\n2. SEUS ARGUMENTOS — Liste os 3 argumentos mais fortes que o usuário\npode usar. Para cada um, explique como apresentar de forma convincente.\n\n3. OBJEÇÕES PROVÁVEIS — Quais as 3 principais objeções ou contra-argumentos\nque a outra parte vai levantar? Como responder cada uma?\n\n4. BATNA — Qual é o melhor cenário alternativo se a negociação não der\ncerto? O usuário deve conhecer seu limite antes de entrar.\n\n5. O QUE EVITAR — Liste 3 erros comuns nesse tipo de negociação e o que\nNÃO dizer em hipótese alguma.\n\nFinalize com uma frase de abertura sugerida para o usuário usar no início\nda negociação.`
  };
}

async function handleRevisorTexto(user: any, args: any) {
  if (!args.texto || !args.tom) {
    return { error: 'Dados incompletos. Peça ao usuário o texto e o tom desejado.' };
  }

  const tipo = args.tipo ? String(args.tipo) : 'Não especificado';

  return {
    success: true,
    instruction: `Você é um especialista em comunicação escrita e copywriting. Revise\ne melhore o texto abaixo.\n\nTEXTO ORIGINAL:\n${args.texto}\n\nTOM DESEJADO: ${args.tom}\nTIPO DE TEXTO: ${tipo}\n\nEntregue o resultado em 3 partes:\n\n1. TEXTO REVISADO — O texto reescrito no tom solicitado, corrigindo erros\ngramaticais, melhorando a clareza e aumentando o impacto. Mantenha a\nessência da mensagem original.\n\n2. O QUE FOI MELHORADO — Explique em 3 pontos rápidos as principais\nmudanças feitas e por que cada uma melhora o texto.\n\n3. VERSÃO ALTERNATIVA — Uma segunda versão mais curta e direta, ideal\npara quem vai ler rapidamente.\n\nEntregue o texto revisado pronto para uso, sem comentários desnecessários.`
  };
}

async function handleSimuladorDecisao(user: any, args: any) {
  if (!args.decisao || !args.opcoes) {
    return { error: 'Dados incompletos. Peça ao usuário a descrição da decisão e as opções consideradas.' };
  }

  const prazo = args.prazo ? String(args.prazo) : 'Não informado';

  return {
    success: true,
    instruction: `Você é um especialista em tomada de decisão usando frameworks baseados\nem evidências. Ajude o usuário a decidir com clareza.\n\nDECISÃO: ${args.decisao}\nOPÇÕES CONSIDERADAS: ${args.opcoes}\nPRAZO PARA DECIDIR: ${prazo}\n\nAplique os seguintes frameworks em sequência:\n\n1. ANÁLISE 10/10/10 — Como você vai se sentir sobre essa decisão daqui\n10 minutos? 10 meses? 10 anos? Aplique para cada opção.\n\n2. PIOR CENÁRIO — Qual o pior resultado possível de cada opção? O usuário\nconsegue conviver com esse pior cenário?\n\n3. CUSTO DE OPORTUNIDADE — O que o usuário abre mão ao escolher cada\nopção? O que ele ganha que não teria na outra?\n\n4. TESTE DO ARREPENDIMENTO — Daqui a 5 anos, qual decisão teria menos\nchance de gerar arrependimento?\n\n5. RECOMENDAÇÃO FINAL — Com base na análise acima, qual opção parece\nmais alinhada com os valores e objetivos do usuário? Seja direto e\njustifique em 2 frases.\n\nFinalize perguntando se o usuário quer explorar algum ponto com mais\nprofundidade.`
  };
}

async function handleFocoSemanal(user: any, args: any) {
  if (!args.objetivo_semana || !args.prioridades) {
    return { error: 'Dados incompletos. Peça ao usuário o objetivo da semana e as prioridades.' };
  }

  const pendencias = args.pendencias_semana_anterior ? String(args.pendencias_semana_anterior) : 'Nenhuma';

  try {
    const supabase = getServiceSupabase();
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - diff);
    monday.setHours(0, 0, 0, 0);

    await supabase.from('weekly_focus').insert([{
      user_id: user.id,
      objetivo_semana: args.objetivo_semana,
      prioridades: args.prioridades,
      pendencias_semana_anterior: args.pendencias_semana_anterior || null,
      semana_inicio: monday.toISOString(),
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.error('Error saving weekly focus:', e);
  }

  return {
    success: true,
    instruction: `O usuário acabou de definir o foco da semana. Registre e responda com\nentusiasmo.\n\nOBJETIVO DA SEMANA: ${args.objetivo_semana}\nPRIORIDADES: ${args.prioridades}\nPENDÊNCIAS DA SEMANA ANTERIOR: ${pendencias}\n\nResponda em 3 partes:\n\n1. CONFIRMAÇÃO — Confirme o foco da semana de forma motivadora e direta.\nMostre que você entendeu o que ele quer conquistar.\n\n2. DICA DA SEMANA — Dê UMA dica prática e específica relacionada ao\nobjetivo dele para maximizar o resultado desta semana.\n\n3. COMBINADO — Diga que vai acompanhar o progresso e que na sexta-feira\nvai perguntar como foi. Finalize com uma frase motivadora curta e genuína.\n\nSeja energético mas não exagerado. Trate o usuário como um parceiro\nde produtividade, não como um coach de palco.`
  };
}

async function handleExplorarCidade(user: any, args: any) {
  if (!user.cidade) {
    return {
      error: 'Cidade não configurada.',
      instruction: 'Informe ao usuário que você ainda não sabe onde ele mora e peça para ele te dizer a cidade e o bairro para poder recomendar lugares próximos.'
    };
  }

  const categoria = String(args.categoria || '').trim();
  const preferencia = args.preferencia ? String(args.preferencia).trim() : '';
  const quando = args.quando ? String(args.quando).trim() : '';
  const bairro = user.bairro ? String(user.bairro).trim() : '';
  const cidade = String(user.cidade).trim();

  const prefRest = preferencia || 'restaurante';
  const prefBem = preferencia || 'bem';
  const quandoSemana = quando || 'semana';
  const quandoFds = quando || 'fim de semana';
  const quandoFds2 = quando || 'esse final de semana';
  const quandoMes = quando || 'esse mês';

  let queries: string[] = [];

  if (categoria === 'restaurante') {
    queries = [
      `${prefRest} ${cidade} ${bairro} melhor avaliado 2026`.trim(),
      `${prefRest} ${cidade} perto de ${bairro} delivery`.trim(),
      `onde comer ${prefBem} ${cidade} recomendação`.trim(),
    ];
  } else if (categoria === 'cinema') {
    queries = [
      `cartaz cinema ${cidade} hoje ${quandoSemana}`.trim(),
      `filmes em cartaz ${cidade} horários ingressos 2026`.trim(),
      `cinema ${cidade} ${preferencia || ''} programação`.trim(),
    ];
  } else if (categoria === 'evento') {
    queries = [
      `eventos ${cidade} ${quandoFds} 2026`.trim(),
      `o que fazer ${cidade} ${quandoFds2}`.trim(),
      `agenda cultural ${cidade} ${quando || 'maio 2026'}`.trim(),
    ];
  } else if (categoria === 'show') {
    queries = [
      `shows ${cidade} ${quandoMes} ${preferencia || ''}`.trim(),
      `agenda de shows ${cidade} 2026 ${preferencia || ''}`.trim(),
      `eventos musicais ${cidade} ingressos`.trim(),
    ];
  } else if (categoria === 'bar') {
    queries = [
      `bares ${cidade} ${bairro} ${preferencia || ''} recomendados`.trim(),
      `happy hour ${cidade} ${bairro} 2026`.trim(),
      `bares mais badalados ${cidade}`.trim(),
    ];
  } else if (categoria === 'atração') {
    queries = [
      `atrações turísticas ${cidade} ${preferencia || ''}`.trim(),
      `pontos turísticos ${cidade} o que visitar`.trim(),
      `passeios ${cidade} ${quandoFds}`.trim(),
    ];
  } else if (categoria === 'startup') {
    queries = [
      `eventos startups tecnologia ${cidade} ${quando || '2026'}`.trim(),
      `meetup tech ${cidade} ${quandoMes}`.trim(),
      `ecossistema startups ${cidade} eventos networking`.trim(),
    ];
  } else {
    queries = [
      `o que fazer ${cidade} ${quando || 'esse fim de semana'} 2026`.trim(),
      `programação cultural ${cidade} ${quando || 'maio 2026'}`.trim(),
      `eventos ${cidade} ${quando || 'essa semana'} ${preferencia || ''}`.trim(),
    ];
  }

  const apiKey = user.settings?.tavily_api_key || process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { error: 'A pesquisa na internet não está configurada. Configure a chave do Tavily para usar recomendações locais.' };
  }

  const requests = queries.map(async (query) => {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'advanced',
          include_answer: true,
          include_images: false,
          include_raw_content: false,
          max_results: 5,
        }),
      });

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  });

  const responses = await Promise.all(requests);
  const allResults: any[] = [];
  for (const r of responses) {
    if (r?.results && Array.isArray(r.results)) {
      allResults.push(...r.results);
    }
  }

  const seen = new Set<string>();
  const consolidated: any[] = [];

  for (const r of allResults) {
    const url = r?.url ? String(r.url) : '';
    if (!url || seen.has(url)) continue;
    seen.add(url);

    let fonte = '';
    try {
      fonte = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      fonte = '';
    }

    const content = r?.content ? String(r.content) : '';
    consolidated.push({
      titulo: r?.title || '',
      descricao: content.length > 200 ? content.slice(0, 200) : content,
      url,
      fonte,
    });

    if (consolidated.length >= 8) break;
  }

  return {
    success: true,
    cidade,
    bairro: bairro || null,
    categoria,
    quando: quando || null,
    resultados: consolidated,
    instruction: `Você encontrou as seguintes opções de ${categoria} em ${cidade}.\n  \n  Apresente os resultados de forma animada e personalizada, como se\n  estivesse recomendando para um amigo. Siga estas regras:\n  \n  1. Comece com uma frase introdutória curta e animada mencionando\n     a cidade e o que você encontrou.\n  \n  2. Liste as melhores opções encontradas nos resultados. Para cada uma:\n     - Mencione o nome/título\n     - Descreva em 1-2 linhas o que é e por que vale a pena\n     - Se tiver valor/preço nos dados, mencione\n     - Se tiver horário ou data, mencione\n     - SEMPRE termine com: "🔗 Link: [url]"\n  \n  3. Se a categoria for cinema, organize por filme com horários\n     disponíveis e valor do ingresso quando disponível.\n  \n  4. Se a categoria for evento ou show, organize por data mais próxima.\n  \n  5. No final, pergunte se o usuário quer mais detalhes sobre alguma\n     opção específica ou se quer buscar em outra categoria.\n  \n  6. Se os resultados estiverem vazios ou irrelevantes, diga de forma\n     honesta que não encontrou boas opções agora e sugira tentar\n     outra categoria ou outro período.\n  \n  Tom: animado, amigável, como um amigo local que conhece a cidade.\n  Nunca liste mais de 5 opções para não sobrecarregar.`
  };
}
