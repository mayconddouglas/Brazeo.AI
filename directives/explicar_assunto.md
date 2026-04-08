# directives/explicar_assunto.md

## Objetivo
O usuário pede a explicação de um assunto difícil. O agente explica utilizando linguagem simples, analogias e exemplos práticos. Se o usuário disser que não entendeu, o agente deve reformular a explicação de outra forma.

## Gatilhos
- "me explica", "não entendi", "como funciona", "o que é"
- Pedidos de explicação de conceitos complexos.

## Entradas Esperadas
- assunto: O assunto ou conceito a ser explicado

## Script de Execução
- Caminho: orchestrator/executor.ts -> handleExplicarAssunto
- Parâmetros: { assunto }

## Saída Esperada
- { success: true, instruction: 'Explique o assunto de forma extremamente simples e didática. Utilize analogias do dia a dia e exemplos práticos. Se o usuário estiver afirmando que não entendeu uma explicação anterior, tente uma abordagem ou analogia completamente diferente.' }

## Formato da Resposta ao Usuário
- Explicação passo a passo
- Uso de pelo menos uma analogia
- Pergunta final: "Ficou mais claro agora?"