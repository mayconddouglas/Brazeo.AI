import { getServiceSupabase } from '@/lib/supabase';

export async function checkAndSendReminders() {
  const supabase = getServiceSupabase();
  const now = new Date().toISOString();

  // Find pending reminders that are due
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*, users(phone)')
    .eq('status', 'pending')
    .lte('scheduled_at', now);

  if (error) {
    console.error('Error fetching reminders:', error);
    return;
  }

  for (const reminder of reminders) {
    // Send WhatsApp message
    const phone = reminder.users?.phone;
    if (phone) {
      await sendWhatsAppMessage(phone, `⏰ Lembrete: ${reminder.content}`);
    }

    // Update status or reschedule if recurrent
    if (reminder.recurrence === 'daily') {
      const nextDate = new Date(reminder.scheduled_at);
      nextDate.setDate(nextDate.getDate() + 1);
      
      await supabase.from('reminders').update({
        scheduled_at: nextDate.toISOString()
      }).eq('id', reminder.id);
    } else if (reminder.recurrence === 'weekly') {
      const nextDate = new Date(reminder.scheduled_at);
      nextDate.setDate(nextDate.getDate() + 7);
      
      await supabase.from('reminders').update({
        scheduled_at: nextDate.toISOString()
      }).eq('id', reminder.id);
    } else {
      await supabase.from('reminders').update({
        status: 'sent'
      }).eq('id', reminder.id);
    }
  }
}

async function sendWhatsAppMessage(phone: string, text: string) {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiUrl || !apiKey || !instance) return;

  try {
    await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: phone,
        options: { delay: 1200, presence: 'composing' },
        textMessage: { text: text }
      })
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}
