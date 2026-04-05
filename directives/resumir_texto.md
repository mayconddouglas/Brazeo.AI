# directives/resumir_texto.md

## Objetivo
O usuário envia qualquer texto longo — artigo, notícia, e-mail, mensagem de grupo — e o agente devolve um resumo em 3 a 5 pontos principais, em linguagem simples.

## Gatilhos
- Textos muito longos (mais de 100 palavras)
- "resume isso", "resumo", "pode resumir?"

## Entradas Esperadas
- content: O texto a ser resumido

## Script de Execução
- Caminho: orchestrator/executor.ts -> handleResumirTexto
- Parâmetros: { content }

## Saída Esperada
- { success: true, instruction: 'Resuma o texto fornecido em 3 a 5 pontos principais, usando linguagem simples e direta.' }

## Formato da Resposta ao Usuário
- "Aqui está o resumo:"
- Lista de 3 a 5 bullet points
- Tom objetivo e direto
