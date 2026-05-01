import { getServiceSupabase } from '@/lib/supabase';

const getBrtNow = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === 'year')?.value ?? '1970');
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? '01');
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? '01');
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = weekdayMap[weekdayStr] ?? 0;

  return { now, year, month, day, hour, weekday };
};

const getStartOfDayBrtUtcIso = () => {
  const { year, month, day } = getBrtNow();
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0)).toISOString();
};

const getEndOfDayBrtUtcIso = () => {
  const start = new Date(getStartOfDayBrtUtcIso());
  start.setUTCDate(start.getUTCDate() + 1);
  return start.toISOString();
};

const getWeekStartBrtUtcIso = () => {
  const { year, month, day, weekday } = getBrtNow();
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const diff = weekday === 0 ? 6 : weekday - 1;
  anchor.setUTCDate(anchor.getUTCDate() - diff);
  return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate(), 3, 0, 0, 0)).toISOString();
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendWhatsAppMessage(phone: string, text: string) {
  const supabase = getServiceSupabase();
  const { data: settings } = await supabase
    .from('settings')
    .select('evolution_api_url, evolution_api_key, evolution_instance_name')
    .eq('id', 1)
    .single();

  const apiUrl = settings?.evolution_api_url || process.env.EVOLUTION_API_URL;
  const apiKey = settings?.evolution_api_key || process.env.EVOLUTION_API_KEY;
  const instance = settings?.evolution_instance_name || process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiUrl || !apiKey || !instance) return;

  await fetch(`${apiUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
    body: JSON.stringify({
      number: phone,
      options: { delay: 1200, presence: 'composing' },
      textMessage: { text },
    }),
  });
}

type ProactiveResult = { enviado: true; tipo: string } | { enviado: false };

export async function avaliarEDisparar(user: any): Promise<ProactiveResult> {
  const supabase = getServiceSupabase();
  const userId = user?.id;
  const phone = user?.phone;
  if (!userId || !phone) return { enviado: false };

  const startOfDay = getStartOfDayBrtUtcIso();
  const endOfDay = getEndOfDayBrtUtcIso();

  const { data: todayLogs, error: countError } = await supabase
    .from('proactive_log')
    .select('id')
    .eq('user_id', userId)
    .gte('enviado_em', startOfDay)
    .lt('enviado_em', endOfDay);

  if (countError) return { enviado: false };
  if ((todayLogs?.length || 0) >= 2) return { enviado: false };

  const { hour, weekday } = getBrtNow();
  if (hour <= 7) return { enviado: false };

  const [
    routineRes,
    memoriesRes,
    lastLogRes,
    lastCityLogRes,
    habitsRes,
    missionRes,
    focusRes,
  ] = await Promise.all([
    supabase.from('user_routine').select('*').eq('user_id', userId).single(),
    supabase.from('user_memories').select('tipo, conteudo, relevancia, ultima_referencia, criado_em').eq('user_id', userId).order('ultima_referencia', { ascending: false }).limit(5),
    supabase.from('proactive_log').select('*').eq('user_id', userId).order('enviado_em', { ascending: false }).limit(1),
    supabase.from('proactive_log').select('enviado_em').eq('user_id', userId).eq('tipo', 'cidade').order('enviado_em', { ascending: false }).limit(1),
    supabase.from('habits').select('*').eq('user_id', userId).eq('status', 'active'),
    supabase.from('missions').select('*').eq('user_id', userId).eq('status', 'active').limit(1),
    supabase.from('weekly_focus').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
  ]);

  const routine = routineRes.error ? null : routineRes.data;
  const memories = memoriesRes.error ? [] : (memoriesRes.data || []);
  const lastLog = lastLogRes.error ? null : (lastLogRes.data?.[0] || null);
  const lastCityLog = lastCityLogRes.error ? null : (lastCityLogRes.data?.[0] || null);
  const habits = habitsRes.error ? [] : (habitsRes.data || []);
  const mission = missionRes.error ? null : (missionRes.data?.[0] || null);
  const focus = focusRes.error ? null : (focusRes.data?.[0] || null);

  const nome = user?.name || 'amigo(a)';
  const nowIso = new Date().toISOString();

  let tipo: string | null = null;
  let mensagem: string | null = null;

  if (routine && typeof routine.dias_sem_contato === 'number' && routine.dias_sem_contato >= 3) {
    const x = routine.dias_sem_contato;
    const r = Math.random();
    if (r < 0.34) mensagem = `Oi ${nome}! Faz ${x} dias que não aparece por aqui... tá tudo bem? 😊`;
    else if (r < 0.67) mensagem = `Ei ${nome}, saudades! Tava pensando em você.\nTá conseguindo manter a rotina? 💙`;
    else mensagem = `${nome}! Sumiu... Alguma novidade? Me conta! 😄`;
    tipo = 'sumico';
  }

  if (!mensagem) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2);
    const cutoffIso = cutoff.toISOString();

    const { data: promessa } = await supabase
      .from('user_memories')
      .select('conteudo')
      .eq('user_id', userId)
      .eq('tipo', 'promessa')
      .lte('criado_em', cutoffIso)
      .lte('ultima_referencia', cutoffIso)
      .order('ultima_referencia', { ascending: true })
      .limit(1);

    const p = promessa?.[0];
    if (p?.conteudo) {
      mensagem = `Ei ${nome}! Lembrei que você tinha falado em ${p.conteudo}.\nConseguiu avançar nisso? 🙂`;
      tipo = 'promessa';
    }
  }

  if (!mensagem && hour >= 17 && hour <= 21 && habits.length > 0) {
    const toUtcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const now = new Date();
    const candidate = habits.find((h: any) => {
      if (!h.last_check_in) return true;
      const last = new Date(h.last_check_in);
      const diffDays = Math.floor((toUtcDay(now) - toUtcDay(last)) / (1000 * 60 * 60 * 24));
      return diffDays >= 1;
    });

    if (candidate) {
      mensagem = `${nome}, e o ${candidate.nome} de hoje? Ainda dá tempo! 💪\nMe confirma quando fizer 🔥`;
      tipo = 'habito';
    }
  }

  if (!mensagem && mission && [25, 50, 75].includes(Number(mission.progresso))) {
    const updatedAt = mission.updated_at || mission.atualizado_at;
    if (updatedAt) {
      const updatedIso = new Date(updatedAt).toISOString();
      if (updatedIso >= startOfDay && updatedIso < endOfDay) {
        mensagem = `${nome}! Você chegou a ${Number(mission.progresso)}% da missão ${mission.titulo} 🎯\nIsso é muito! Continua firme que você vai chegar lá 🚀`;
        tipo = 'missao';
      }
    }
  }

  const weekStart = getWeekStartBrtUtcIso();

  if (!mensagem && weekday === 1) {
    const { data: focusThisWeek } = await supabase
      .from('weekly_focus')
      .select('id')
      .eq('user_id', userId)
      .eq('semana_inicio', weekStart)
      .limit(1);

    if (!focusThisWeek || focusThisWeek.length === 0) {
      mensagem = `Boa semana, ${nome}! 🌟\nJá sabe qual é seu foco principal essa semana?\nMe conta que te ajudo a organizar! 💙`;
      tipo = 'foco_semanal';
    }
  }

  if (!mensagem && weekday === 5) {
    const { data: focusThisWeek } = await supabase
      .from('weekly_focus')
      .select('objetivo_semana')
      .eq('user_id', userId)
      .eq('semana_inicio', weekStart)
      .order('created_at', { ascending: false })
      .limit(1);

    const fw = focusThisWeek?.[0];
    if (fw?.objetivo_semana) {
      mensagem = `${nome}, é sexta! 🎉\nVocê definiu que o foco dessa semana era: ${fw.objetivo_semana}\nComo foi? Conseguiu avançar? Me conta! 😊`;
      tipo = 'balanco_semana';
    }
  }

  if (!mensagem && (weekday === 5 || weekday === 6) && hour >= 14 && hour <= 19) {
    const lastCitySent = lastCityLog?.enviado_em ? new Date(lastCityLog.enviado_em) : null;
    const olderThan7Days = !lastCitySent || (Date.now() - lastCitySent.getTime()) > 1000 * 60 * 60 * 24 * 7;
    if (olderThan7Days) {
      const cidade = user?.cidade || user?.city || '';
      const diaStr = weekday === 5 ? 'sexta' : 'sábado';
      const diaTitle = weekday === 5 ? 'Sexta' : 'Sábado';
      const r = Math.random();
      if (r < 0.34) {
        mensagem = `${nome}, é ${diaStr}! 🎉 Já tem programa pra hoje?\nMe fala o que você tá com vontade — cinema, restaurante, show —\nque eu pesquiso o que tem perto de você! 😄`;
      } else if (r < 0.67) {
        mensagem = `Ei ${nome}! ${diaTitle} chegou 🙌\nQuer uma sugestão de programa aqui em ${cidade}?\nMe diz o estilo e eu acho algo bacana perto de você!`;
      } else {
        mensagem = `${nome}, fim de semana chegando! 🌆\nTem algum rolê em mente ou quer que eu veja o que tá acontecendo\nem ${cidade} esse final de semana?`;
      }
      tipo = 'cidade';
    }
  }

  if (!mensagem) {
    const lastSent = lastLog?.enviado_em ? new Date(lastLog.enviado_em) : null;
    const olderThan2Days = !lastSent || (Date.now() - lastSent.getTime()) > 1000 * 60 * 60 * 24 * 2;
    if (olderThan2Days) {
      const candidates = memories.filter((m: any) => typeof m.relevancia === 'number' && m.relevancia >= 7);
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        mensagem = `Ei ${nome}! Tava lembrando que você comentou sobre\n${chosen.conteudo}. Tem alguma novidade sobre isso? 😊`;
        tipo = 'curiosidade';
      }
    }
  }

  if (!mensagem || !tipo) return { enviado: false };

  try {
    await supabase.from('proactive_log').insert([{
      user_id: userId,
      tipo,
      mensagem,
      enviado_em: nowIso,
    }]);
  } catch {}

  try {
    await sendWhatsAppMessage(phone, mensagem);
  } catch (e) {
    await delay(0);
  }

  return { enviado: true, tipo };
}
