# directives/resumir_materia.md

## Objetivo
O usuário envia um tema, conteúdo ou anotações escolares e o agente devolve um resumo estruturado em tópicos, adaptado ao nível do aluno (médio, faculdade, concurso).

## Gatilhos
- "resuma essa matéria", "resumo para a prova", "resume o assunto"
- Pedidos de resumo de temas escolares ou acadêmicos.

## Entradas Esperadas
- assunto: O tema ou matéria a ser resumido
- nivel: Opcional. O nível de profundidade desejado (médio, faculdade, concurso)

## Script de Execução
- Caminho: orchestrator/executor.ts -> handleResumirMateria
- Parâmetros: { assunto, nivel }

## Saída Esperada
- { success: true, instruction: 'Crie um resumo estruturado em tópicos sobre o assunto solicitado. Adapte a profundidade e a linguagem para o nível educacional especificado. Organize com títulos, subtópicos e destaque as palavras-chave.' }

## Formato da Resposta ao Usuário
- "Aqui está o resumo:"
- Divisão por tópicos principais e subtópicos
- Tom didático e organizado