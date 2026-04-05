# directives/consultor_rapido.md

## Objetivo
O agente responde a dúvidas práticas do cotidiano de forma direta e objetiva.

## Gatilhos
- Perguntas diretas (ex: "Vale a pena...", "O que é melhor...", "Como calculo...")
- Dúvidas sobre finanças, saúde básica, cálculos, etc.

## Entradas Esperadas
- content: A pergunta do usuário

## Script de Execução
- Caminho: orchestrator/executor.ts (Tratado diretamente pelo LLM)
- Parâmetros: { content }

## Saída Esperada
- { status: 'handled_by_llm' }

## Formato da Resposta ao Usuário
- Resposta direta e objetiva
- Sem enrolação, indo direto ao ponto
- Se envolver cálculos, mostrar a conta de forma simples
