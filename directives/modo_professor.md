# directives/modo_professor.md

## Objetivo
O usuário quer estudar de forma interativa. O agente entra no modo professor: faz uma pergunta por vez, aguarda a resposta, corrige com explicação e só avança para o próximo conceito quando o aluno entender.

## Gatilhos
- "modo professor", "estudar interativo", "me ensine passo a passo", "tutor de"

## Entradas Esperadas
- assunto: O assunto a ser ensinado de forma interativa

## Script de Execução
- Caminho: orchestrator/executor.ts -> handleModoProfessor
- Parâmetros: { assunto }

## Saída Esperada
- { success: true, instruction: 'Inicie ou continue o Modo Professor. Faça apenas UMA pergunta ou ensine UM conceito por vez. Aguarde a resposta do aluno. Ao receber a resposta, valide, explique o conceito se necessário e só avance para a próxima etapa se o aluno demonstrar compreensão. Mantenha o tom muito encorajador e paciente.' }

## Formato da Resposta ao Usuário
- Correção/Validação da resposta anterior (se houver)
- Breve explicação de um novo conceito
- Apenas UMA pergunta para o aluno responder