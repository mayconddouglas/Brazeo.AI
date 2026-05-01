import { getServiceSupabase } from '@/lib/supabase';

const getBrtParts = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(now);

  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';

  const hour = Number(hourStr);
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = weekdayMap[weekdayStr] ?? 0;

  return { now, hour, weekday };
};

const weightedAvgInt = (prev: unknown, next: number) => {
  const prevNum = typeof prev === 'number' && Number.isFinite(prev) ? prev : null;
  if (prevNum == null) return next;
  return Math.round((prevNum * 2 + next) / 3);
};

export async function registrarAtividade(user_id: string) {
  const { now, hour, weekday } = getBrtParts();
  const supabase = getServiceSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from('user_routine')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (!existing) {
    await supabase.from('user_routine').upsert([{
      user_id,
      ultimo_contato: now.toISOString(),
      dias_sem_contato: 0,
      total_mensagens_semana: 1,
      dias_mais_ativos: String(weekday),
      atualizado_em: now.toISOString(),
    }], { onConflict: 'user_id' });
    return;
  }

  const lastContact = existing.ultimo_contato ? new Date(existing.ultimo_contato) : null;
  const diffDays = lastContact ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const updates: any = {
    user_id,
    total_mensagens_semana: (typeof existing.total_mensagens_semana === 'number' ? existing.total_mensagens_semana : 0) + 1,
    dias_sem_contato: Math.max(0, diffDays),
    ultimo_contato: now.toISOString(),
    atualizado_em: now.toISOString(),
  };

  if (hour >= 5 && hour <= 11) {
    updates.hora_mais_ativa_manha = (typeof existing.hora_mais_ativa_manha === 'number' ? existing.hora_mais_ativa_manha : 0) + 1;
  } else if (hour >= 12 && hour <= 17) {
    updates.hora_mais_ativa_tarde = (typeof existing.hora_mais_ativa_tarde === 'number' ? existing.hora_mais_ativa_tarde : 0) + 1;
  } else if (hour >= 18 && hour <= 23) {
    updates.hora_mais_ativa_noite = (typeof existing.hora_mais_ativa_noite === 'number' ? existing.hora_mais_ativa_noite : 0) + 1;
  }

  if (hour >= 22 && hour <= 23) {
    updates.hora_dorme_estimada = weightedAvgInt(existing.hora_dorme_estimada, hour);
  }

  if (hour >= 5 && hour <= 8) {
    updates.hora_acorda_estimada = weightedAvgInt(existing.hora_acorda_estimada, hour);
  }

  const diasAtivos = String(existing.dias_mais_ativos || '');
  const diasArr = diasAtivos ? diasAtivos.split(',').map((d: string) => d.trim()).filter(Boolean) : [];
  diasArr.push(String(weekday));
  updates.dias_mais_ativos = diasArr.slice(-20).join(',');

  await supabase.from('user_routine').upsert([updates], { onConflict: 'user_id' });
}

export async function registrarTema(user_id: string, tema: string) {
  const supabase = getServiceSupabase();
  const normalizedTema = String(tema || '').trim();
  if (!normalizedTema) return;

  const { data: existing, error: fetchError } = await supabase
    .from('user_routine')
    .select('temas_frequentes')
    .eq('user_id', user_id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  const temasStr = existing?.temas_frequentes ? String(existing.temas_frequentes) : '';
  const temasArr = temasStr ? temasStr.split(',').map((t) => t.trim()).filter(Boolean) : [];
  temasArr.push(normalizedTema);
  const nextTemas = temasArr.slice(-20).join(',');

  await supabase.from('user_routine').upsert([{
    user_id,
    temas_frequentes: nextTemas,
    atualizado_em: new Date().toISOString(),
  }], { onConflict: 'user_id' });
}

export async function getPerfilRotina(user_id: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from('user_routine').select('*').eq('user_id', user_id).single();
  if (error) return null;
  return data;
}
