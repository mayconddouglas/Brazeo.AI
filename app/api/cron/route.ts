import { NextResponse } from 'next/server';
import { checkAndSendReminders } from '@/execution/cron-jobs';

export async function GET(req: Request) {
  try {
    // Basic auth check for cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    await checkAndSendReminders();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
