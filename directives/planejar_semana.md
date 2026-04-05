# directives/planejar_semana.md

## Objetivo
Enviar proativamente toda segunda-feira uma mensagem convidando o usuário a planejar a semana, e depois organizar o que ele disser.

## Gatilhos
- Disparo automático via pg_cron toda segunda-feira no horário configurado
- Mensagem manual do usuário com: "planejar semana", "organizar semana"

## Entradas Esperadas
- Lista livre de tarefas e compromissos relatados pelo usuário em linguagem natural

## Script de Execução
- Caminho: orchestrator/executor.ts -> handlePlanejarSemana
- Parâmetros: { user, content }

## Saída Esperada
- Plano semanal estruturado por dia, com base no que o usuário informou
- Tarefas pendentes da semana anterior devem ser incluídas automaticamente

## Formato da Resposta ao Usuário
- Estrutura por dia (Seg, Ter, Qua, ...)
- Tom motivacional e direto
- Máximo de 3 tarefas por dia para não sobrecarregar

## Edge Cases
- Usuário não responde ao planejador → tentar novamente na quarta-feira
- Usuário diz "não tenho nada" → registrar semana livre e desejar boa semana
