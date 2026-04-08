# directives/plano_estudos.md

## Objetivo
O usuário pede ajuda para organizar seus estudos. O agente monta um plano semanal detalhado, dividindo por dia, matéria, tempo sugerido e tipo de atividade.

## Gatilhos
- "montar plano de estudos", "cronograma de estudos", "como organizar meus estudos", "o que estudar essa semana"

## Entradas Esperadas
- materias: Lista de matérias ou objetivos que o usuário deseja estudar
- disponibilidade: Opcional. Tempo disponível por dia (ex: 2 horas)

## Script de Execução
- Caminho: orchestrator/executor.ts -> handlePlanoEstudos
- Parâmetros: { materias, disponibilidade }

## Saída Esperada
- { success: true, instruction: 'Crie um cronograma semanal de estudos (Segunda a Sexta/Domingo) distribuindo as matérias fornecidas. Para cada dia, inclua o tempo sugerido e intercale tipos de atividade (leitura, exercícios, revisão). Mantenha o cronograma realista e equilibrado.' }

## Formato da Resposta ao Usuário
- "Aqui está sua sugestão de plano de estudos:"
- Dias da semana em negrito
- Para cada dia: Matéria, tempo e tipo de atividade
- Dica final de produtividade