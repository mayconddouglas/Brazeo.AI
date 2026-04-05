import { NextResponse } from 'next/server';
import { runAgent } from '@/orchestrator/agent-runner';

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
      // Handle audio message later
      content = '[Áudio recebido]';
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
