export type ModelTier = 'fast' | 'smart';

export interface RouterResult {
  model: string;
  tier: ModelTier;
  reason: string;
}

const SMART_SKILLS = new Set([
  'modo_professor',
  'plano_estudos',
  'resumir_materia',
  'explicar_assunto',
  'criar_questionario',
  'pesquisar_internet',
  'modo_empreendedor',
  'coach_financeiro',
  'modo_negociacao',
  'revisor_texto',
  'simulador_decisao',
  'diario_inteligente',
  'foco_semanal',
]);

const SMART_KEYWORDS = [
  'explica',
  'explicar',
  'explique',
  'analisa',
  'analisar',
  'analise',
  'análise',
  'compare',
  'comparar',
  'comparação',
  'diferença entre',
  'qual a diferença',
  'por que',
  'por quê',
  'porque',
  'como funciona',
  'como fazer',
  'como posso',
  'me ensina',
  'me ensine',
  'me ajuda a entender',
  'o que é',
  'o que são',
  'o que significa',
  'estratégia',
  'estrategia',
  'plano',
  'planejamento',
  'forex',
  'trading',
  'investimento',
  'mercado',
  'psicologia',
  'filosofia',
  'resumo',
  'resumir',
  'resuma',
  'escreve',
  'escrever',
  'redija',
  'elabore',
  'quais são',
  'quais os',
  'me dá',
  'me dê',
  'me passa',
  'preciso entender',
  'quero entender',
];

const normalizeText = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function routeModel(message: string, toolCalled?: string): RouterResult {
  const FAST_MODEL = 'anthropic/claude-haiku-4-5';
  const SMART_MODEL = 'anthropic/claude-sonnet-4-5';

  if (toolCalled && SMART_SKILLS.has(toolCalled)) {
    return { model: SMART_MODEL, tier: 'smart', reason: `skill_${toolCalled}` };
  }

  const msgNormalized = normalizeText(message);
  const matchedKeyword = SMART_KEYWORDS.find((k) => msgNormalized.includes(normalizeText(k)));

  if (message.length > 280 && matchedKeyword) {
    return { model: SMART_MODEL, tier: 'smart', reason: 'long_analytical_message' };
  }

  if (matchedKeyword) {
    return { model: SMART_MODEL, tier: 'smart', reason: `keyword_${matchedKeyword}` };
  }

  return { model: FAST_MODEL, tier: 'fast', reason: 'default_simple' };
}
