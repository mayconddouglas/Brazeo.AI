# directives/transcrever_audio.md

## Objetivo
O usuário encaminha um áudio longo recebido no WhatsApp e o agente transcreve e resume o conteúdo.

## Gatilhos
- Mensagem do tipo áudio
- "transcreve", "o que tem nesse áudio?"

## Entradas Esperadas
- audio_url: URL do áudio recebido via Evolution API

## Script de Execução
- Caminho: execution/transcrever_audio.ts (A ser implementado)
- Parâmetros: { audio_url }

## Saída Esperada
- { success: true, transcription, summary }

## Formato da Resposta ao Usuário
- "🎙️ Transcrição:"
- [Texto transcrito]
- "📝 Resumo:"
- [Resumo em bullet points]
