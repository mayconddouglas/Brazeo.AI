# directives/criar_questionario.md

## Objetivo
O usuário pede questões para praticar sobre um assunto. O agente cria perguntas de múltipla escolha (A, B, C, D), corrige as respostas dadas posteriormente e explica os erros.

## Gatilhos
- "crie um questionário", "me faça perguntas", "questões sobre", "exercícios de"

## Entradas Esperadas
- assunto: O tema das questões
- quantidade: Número de questões (padrão: 3 a 5)

## Script de Execução
- Caminho: orchestrator/executor.ts -> handleCriarQuestionario
- Parâmetros: { assunto, quantidade }

## Saída Esperada
- { success: true, instruction: 'Crie um questionário com a quantidade solicitada de perguntas de múltipla escolha (A, B, C, D) sobre o assunto. Se o usuário estiver respondendo a um questionário anterior, corrija as respostas, parabenize os acertos e explique detalhadamente o porquê dos erros.' }

## Formato da Resposta ao Usuário
- Apresentação das questões enumeradas
- Alternativas claras
- Ou, no caso de correção: gabarito seguido de explicações didáticas para cada erro