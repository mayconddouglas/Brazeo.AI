# directives/criar_lembrete.md

## Objetivo
Criar um lembrete agendado para o usuário, que será disparado via WhatsApp no horário especificado.

## Gatilhos
- "lembra de", "me avisa", "me lembra", "não deixa esquecer"
- "todo dia às", "toda segunda", "amanhã às", "daqui X minutos"

## Entradas Esperadas
- content: descrição do lembrete (obrigatório)
- scheduled_at: data e hora (obrigatório — perguntar se não informado)
- recurrence: daily | weekly | null (opcional)

## Script de Execução
- Caminho: orchestrator/executor.ts -> handleCriarLembrete
- Parâmetros: { user, content }

## Saída Esperada
- { success: true, reminder } ou { error: 'missing_time', task }

## Formato da Resposta ao Usuário
- "Anotado! Vou te lembrar de [content] em [data/hora] ⏰"
- Se recorrente: "Vou te lembrar todo(a) [frequência] às [hora] 🔁"

## Edge Cases
- Horário no passado → perguntar se quer para o próximo dia
- Sem horário especificado → perguntar "pra quando você quer esse lembrete?"
