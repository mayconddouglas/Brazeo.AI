import { getServiceSupabase } from '@/lib/supabase';

export type MemoryTipo =
  | 'objetivo'
  | 'conquista'
  | 'dificuldade'
  | 'preferencia'
  | 'promessa'
  | 'contexto_pessoal'
  | 'emocional';

type SaveResult = { success: true } | { error: string };

const sanitizeIlikeProbe = (value: string) => value.replace(/[%_]/g, '').trim();

export async function salvarMemoria(user_id: string, tipo: string, conteudo: string, contexto?: string): Promise<SaveResult> {
  try {
    if (!user_id || !tipo || !conteudo) return { error: 'Parâmetros inválidos para salvar memória.' };

    const supabase = getServiceSupabase();
    const probe = sanitizeIlikeProbe(conteudo.slice(0, 40));

    const { data: similar, error: findError } = await supabase
      .from('user_memories')
      .select('id, relevancia')
      .eq('user_id', user_id)
      .eq('tipo', tipo)
      .ilike('conteudo', `%${probe}%`)
      .order('ultima_referencia', { ascending: false })
      .limit(1);

    if (findError) return { error: `Erro ao buscar memória similar: ${findError.message}` };

    if (similar && similar.length > 0) {
      const existing = similar[0] as any;
      const currentRel = typeof existing.relevancia === 'number' ? existing.relevancia : 5;
      const nextRel = Math.min(currentRel + 1, 10);

      const { error: updError } = await supabase
        .from('user_memories')
        .update({ ultima_referencia: new Date().toISOString(), relevancia: nextRel })
        .eq('id', existing.id);

      if (updError) return { error: `Erro ao atualizar memória: ${updError.message}` };
    } else {
      const { error: insError } = await supabase.from('user_memories').insert([{
        user_id,
        tipo,
        conteudo,
        contexto: contexto || null,
        relevancia: 5,
        ultima_referencia: new Date().toISOString(),
        criado_em: new Date().toISOString(),
      }]);

      if (insError) return { error: `Erro ao inserir memória: ${insError.message}` };
    }

    const { data: allMemories, error: listError } = await supabase
      .from('user_memories')
      .select('id, relevancia, criado_em')
      .eq('user_id', user_id)
      .order('relevancia', { ascending: true })
      .order('criado_em', { ascending: true });

    if (listError) return { error: `Erro ao listar memórias: ${listError.message}` };

    const list = allMemories || [];
    if (list.length > 50) {
      const toDelete = list.slice(0, list.length - 50).map((m: any) => m.id).filter(Boolean);
      if (toDelete.length > 0) {
        const { error: delError } = await supabase.from('user_memories').delete().in('id', toDelete);
        if (delError) return { error: `Erro ao limpar memórias antigas: ${delError.message}` };
      }
    }

    return { success: true };
  } catch (e: any) {
    return { error: `Erro inesperado ao salvar memória: ${e.message}` };
  }
}

export async function recuperarMemoriasRelevantes(user_id: string, limite: number = 10): Promise<string[]> {
  const supabase = getServiceSupabase();
  const safeLimit = Number.isFinite(limite) && limite > 0 ? Math.floor(limite) : 10;

  const { data, error } = await supabase
    .from('user_memories')
    .select('tipo, conteudo')
    .eq('user_id', user_id)
    .order('relevancia', { ascending: false })
    .order('ultima_referencia', { ascending: false })
    .limit(safeLimit);

  if (error || !data) return [];
  return data.map((m: any) => `- ${m.tipo}: ${m.conteudo}`);
}

export function extrairEsalvarMemoriasDeConversa(user_id: string, mensagem: string, resposta: string) {
  try {
    const text = String(mensagem || '').toLowerCase();
    if (!text.trim()) return;

    const tipos: string[] = [];

    if (/(quero| vou |pretendo|meu sonho|minha meta|objetivo|planejando)/.test(text)) tipos.push('objetivo');
    if (/(consegui|terminei|completei|finalizei|venci|superei|passou)/.test(text)) tipos.push('conquista');
    if (/(tô com dificuldade|nao consigo|não consigo|tá difícil|ta dificil|problema com|me preocupa|tô preocupado|to preocupado|tô estressado com|to estressado com)/.test(text)) tipos.push('dificuldade');
    if (/(vou fazer|prometo|dessa vez|vou começar|vou comecar|vou parar)/.test(text)) tipos.push('promessa');
    if (/(minha esposa|meu marido|meu filho|minha filha|meu trabalho|minha empresa|moro em|trabalho em|meu chefe|minha família|minha familia)/.test(text)) tipos.push('contexto_pessoal');

    const unique = Array.from(new Set(tipos));
    if (unique.length === 0) return;

    unique.forEach((tipo) => {
      salvarMemoria(user_id, tipo, mensagem).catch((e) => console.error('Error saving memory from conversation:', e));
    });
  } catch (e) {
    console.error('Error extracting memories from conversation:', e);
  }
}
