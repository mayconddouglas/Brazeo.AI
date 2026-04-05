# directives/resposta_livre.md

## Objetivo
Qualquer dúvida que não se encaixe nas outras categorias é tratada como pergunta livre — receitas, traduções, conselhos gerais, saudações.

## Gatilhos
- Mensagens que não ativam nenhuma outra diretiva
- Saudações ("Oi", "Bom dia")
- Conversa fiada

## Entradas Esperadas
- content: A mensagem do usuário

## Script de Execução
- Caminho: orchestrator/executor.ts (Tratado diretamente pelo LLM)
- Parâmetros: { content }

## Saída Esperada
- { status: 'handled_by_llm' }

## Formato da Resposta ao Usuário
- Tom amigável e conversacional
- Se for saudação, responder de forma simpática e perguntar como pode ajudar
