import { NextResponse } from 'next/server';
import { runAgent } from '@/orchestrator/agent-runner';

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();
    
    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 });
    }

    const reply = await runAgent(phone, message);
    
    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
