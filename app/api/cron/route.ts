import { NextResponse } from 'next/server';
import { 
  checkAndSendReminders, 
  sendGoodMorningMessage, 
  checkAndSendFeedbackRequest, 
  sendWeeklySummary,
  // @ts-ignore: Function might be implemented in the future
  checkAndSendBirthdayMessage 
} from '@/execution/cron-jobs';
import { getServiceSupabase } from '@/lib/supabase';
import { processBroadcast } from '@/app/dashboard/broadcast/actions';

export async function GET(req: Request) {
  try {
    // Basic auth check for cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const job = url.searchParams.get('job');

    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    switch (job) {
      case 'lembretes':
        await checkAndSendReminders();
        break;

      case 'broadcasts':
        const { data: scheduledBroadcasts } = await supabase
          .from('broadcasts')
          .select('id')
          .eq('status', 'scheduled')
          .lte('scheduled_at', now);
          
        if (scheduledBroadcasts && scheduledBroadcasts.length > 0) {
          const ids = scheduledBroadcasts.map(b => b.id);
          await supabase
            .from('broadcasts')
            .update({ status: 'processing' })
            .in('id', ids);
            
          for (const broadcast of scheduledBroadcasts) {
            processBroadcast(broadcast.id).catch(console.error);
          }
        }
        break;

      case 'bom_dia':
        await sendGoodMorningMessage();
        break;

      case 'feedback':
        await checkAndSendFeedbackRequest();
        break;

      case 'resumo_semanal':
        await sendWeeklySummary();
        break;

      case 'aniversario':
        if (typeof checkAndSendBirthdayMessage === 'function') {
          await checkAndSendBirthdayMessage();
        }
        break;

      default:
        // Default behavior (no parameter or unknown parameter)
        // 1. Send Reminders
        await checkAndSendReminders();
        
        // 2. Send Scheduled Broadcasts
        const { data: defaultBroadcasts } = await supabase
          .from('broadcasts')
          .select('id')
          .eq('status', 'scheduled')
          .lte('scheduled_at', now);
          
        if (defaultBroadcasts && defaultBroadcasts.length > 0) {
          const ids = defaultBroadcasts.map(b => b.id);
          await supabase
            .from('broadcasts')
            .update({ status: 'processing' })
            .in('id', ids);
            
          for (const broadcast of defaultBroadcasts) {
            processBroadcast(broadcast.id).catch(console.error);
          }
        }
        break;
    }
    
    return NextResponse.json({ success: true, job: job || 'default' });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
