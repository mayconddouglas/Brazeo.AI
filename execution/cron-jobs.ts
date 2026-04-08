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

export async function checkAndSendFeedbackRequest() {
  const supabase = getServiceSupabase();
  const now = new Date();

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'active');

  if (error || !users) {
    console.error('Error fetching users for feedback:', error);
    return;
  }

  for (const user of users) {
    const prefs = user.preferences || {};
    const ultimoFeedback = prefs.ultimo_feedback;

    let shouldSend = false;
    if (!ultimoFeedback) {
      shouldSend = true;
    } else {
      const lastDate = new Date(ultimoFeedback);
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays >= 3) {
        shouldSend = true;
      }
    }

    if (shouldSend) {
      const name = user.name || 'amigo(a)';
      const text = `Oi ${name}! Como estou indo até agora? 😊\nMe responde com um número:\n1 - Tô adorando 🔥\n2 - Tá bom, mas pode melhorar\n3 - Tive algum problema\nSua opinião me ajuda a ficar melhor!`;
      
      await sendWhatsAppMessage(user.phone, text);

      prefs.ultimo_feedback = now.toISOString();
      await supabase.from('users').update({ preferences: prefs }).eq('id', user.id);
    }
  }
}

export async function sendGoodMorningMessage() {
  const supabase = getServiceSupabase();
  const now = new Date();
  
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'active');

  if (usersError || !users) {
    console.error('Error fetching users for good morning message:', usersError);
    return;
  }

  const { data: reminders, error: remindersError } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'pending')
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString());

  if (remindersError) {
    console.error('Error fetching today reminders:', remindersError);
    return;
  }

  const remindersByUser = reminders?.reduce((acc: any, reminder: any) => {
    if (!acc[reminder.user_id]) acc[reminder.user_id] = [];
    acc[reminder.user_id].push(reminder);
    return acc;
  }, {});

  for (const user of users) {
    const name = user.name || 'amigo(a)';
    const userReminders = remindersByUser?.[user.id] || [];

    if (userReminders.length > 0) {
      const remindersList = userReminders.map((r: any) => {
        const time = new Date(r.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        return `\n- ${time} - ${r.content}`;
      }).join('');

      const text = `Bom dia, ${name}! ☀️ Hoje você tem:${remindersList}\n\nPosso te lembrar antes de cada um?`;
      await sendWhatsAppMessage(user.phone, text);
    } else {
      const text = `Bom dia, ${name}! ☀️ Sua agenda está livre hoje. Posso te ajudar a organizar o dia?`;
      await sendWhatsAppMessage(user.phone, text);
    }
  }
}

export async function sendWeeklySummary() {
  const supabase = getServiceSupabase();
  const now = new Date();
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const isoSevenDaysAgo = sevenDaysAgo.toISOString();

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('status', 'active');

  if (usersError || !users) {
    console.error('Error fetching users for weekly summary:', usersError);
    return;
  }

  const { data: reminders } = await supabase
    .from('reminders')
    .select('user_id')
    .gte('created_at', isoSevenDaysAgo);

  const { data: messages } = await supabase
    .from('messages')
    .select('user_id, role, intent')
    .gte('created_at', isoSevenDaysAgo);

  const remindersByUser: Record<string, number> = {};
  const messagesByUser: Record<string, number> = {};
  const summariesByUser: Record<string, number> = {};

  reminders?.forEach(r => {
    remindersByUser[r.user_id] = (remindersByUser[r.user_id] || 0) + 1;
  });

  messages?.forEach(m => {
    if (m.role === 'user') {
      messagesByUser[m.user_id] = (messagesByUser[m.user_id] || 0) + 1;
    }
    if (m.intent === 'resumir_texto') {
      summariesByUser[m.user_id] = (summariesByUser[m.user_id] || 0) + 1;
    }
  });

  for (const user of users) {
    const totalReminders = remindersByUser[user.id] || 0;
    const totalMessages = messagesByUser[user.id] || 0;
    const totalSummaries = summariesByUser[user.id] || 0;

    if (totalReminders === 0 && totalMessages === 0 && totalSummaries === 0) {
      continue;
    }

    const name = user.name || 'amigo(a)';
    const text = `${name}, aqui está seu resumo da semana! 📋\n✅ ${totalReminders} lembretes criados\n📚 ${totalSummaries} textos resumidos\n💬 ${totalMessages} mensagens trocadas\n\nPosso ajudar com algo antes do fim de semana? 😊`;
    
    await sendWhatsAppMessage(user.phone, text);
  }
}

async function sendWhatsAppMessage(phone: string, text: string) {
  const supabase = getServiceSupabase();
  const { data: settings } = await supabase.from('settings').select('evolution_api_url, evolution_api_key, evolution_instance_name').eq('id', 1).single();

  const apiUrl = settings?.evolution_api_url || process.env.EVOLUTION_API_URL;
  const apiKey = settings?.evolution_api_key || process.env.EVOLUTION_API_KEY;
  const instance = settings?.evolution_instance_name || process.env.EVOLUTION_INSTANCE_NAME;

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
