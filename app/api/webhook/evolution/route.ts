import { NextResponse } from 'next/server';
import { runAgent } from '@/orchestrator/agent-runner';
import OpenAI, { toFile } from 'openai';
import { getServiceSupabase } from '@/lib/supabase';

async function transcribeAudio(base64: string, apiKey: string) {
  const isGroq = apiKey.startsWith('gsk_');
  
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: isGroq ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1'
  });

  // OGG is standard for WhatsApp audio
  const buffer = Buffer.from(base64, 'base64');
  const file = await toFile(buffer, 'audio.ogg', { type: 'audio/ogg' });

  const response = await openai.audio.transcriptions.create({
    file: file,
    model: isGroq ? 'whisper-large-v3' : 'whisper-1',
  });

  return response.text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Evolution API typically sends messages in this format
    // We need to extract the relevant info
    
    // Basic validation
    if (!body || !body.data || !body.data.message) {
      return NextResponse.json({ success: true, message: 'Ignored: No message data' });
    }

    const messageData = body.data;
    const remoteJid = messageData.key.remoteJid;
    
    // Ignore status broadcasts and groups for now
    if (remoteJid === 'status@broadcast' || remoteJid.includes('@g.us')) {
      return NextResponse.json({ success: true, message: 'Ignored: Broadcast or Group' });
    }

    // Extract phone number
    const phone = remoteJid.split('@')[0];
    
    // Extract message content
    let content = '';
    const message = messageData.message;
    
    if (message?.conversation) {
      content = message.conversation;
    } else if (message?.extendedTextMessage?.text) {
      content = message.extendedTextMessage.text;
    } else if (message?.audioMessage) {
      const base64Audio = messageData.message.base64 || messageData.base64 || message.audioMessage.base64;
      
      if (base64Audio) {
        try {
          const supabase = getServiceSupabase();
          const { data: settings } = await supabase.from('settings').select('openai_api_key').eq('id', 1).single();
          const apiKey = settings?.openai_api_key || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;

          if (apiKey) {
            const transcript = await transcribeAudio(base64Audio, apiKey);
            content = transcript ? `[Áudio transcrito pelo usuário]: "${transcript}"` : '[Áudio recebido, mas inaudível]';
          } else {
            content = '[Áudio recebido, mas a chave de transcrição Whisper não está configurada no painel]';
          }
        } catch (err) {
          console.error('Transcription error:', err);
          content = '[Áudio recebido, mas ocorreu um erro na transcrição]';
        }
      } else {
        content = '[Áudio recebido, mas o webhook não está enviando dados base64]';
      }
    } else {
      return NextResponse.json({ success: true, message: 'Ignored: Unsupported message type' });
    }

    // Run the agent orchestrator asynchronously so we don't block the webhook response
    // In a real production app, you might want to use a queue here
    // For this MVP, we'll just fire and forget, or await if it's fast enough
    // Vercel serverless functions might kill background tasks, so we await it
    await runAgent(phone, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
