import { NextResponse } from 'next/server';
import { checkAndSendReminders } from '@/execution/cron-jobs';
import { getServiceSupabase } from '@/lib/supabase';
import { processBroadcast } from '@/app/dashboard/broadcast/actions';

export async function GET(req: Request) {
  try {
    // Basic auth check for cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 1. Send Reminders
    await checkAndSendReminders();
    
    // 2. Send Scheduled Broadcasts
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();
    
    const { data: scheduledBroadcasts } = await supabase
      .from('broadcasts')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);
      
    if (scheduledBroadcasts && scheduledBroadcasts.length > 0) {
      // Mark them as processing to avoid duplicate sending
      const ids = scheduledBroadcasts.map(b => b.id);
      await supabase
        .from('broadcasts')
        .update({ status: 'processing' })
        .in('id', ids);
        
      // Process them asynchronously
      for (const broadcast of scheduledBroadcasts) {
        processBroadcast(broadcast.id).catch(console.error);
      }
    }
    
    return NextResponse.json({ success: true, processedBroadcasts: scheduledBroadcasts?.length || 0 });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
