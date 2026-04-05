"use server";

import { getServiceSupabase } from "@/lib/supabase";

export async function sendMessageFromDashboard(userId: string, phone: string, content: string) {
  if (!userId || !phone || !content) return { error: "Parâmetros inválidos" };

  const supabase = getServiceSupabase();

  try {
    // 1. Salvar no banco como 'assistant' (pois está sendo enviado do painel)
    const { data: msg, error: dbError } = await supabase.from('messages').insert([{
      user_id: userId,
      role: 'assistant',
      content: content,
      intent: 'resposta_manual_dashboard'
    }]).select().single();

    if (dbError) throw dbError;

    // 2. Enviar mensagem via Evolution API
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE_NAME;

    if (apiUrl && apiKey && instance) {
      await fetch(`${apiUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number: phone,
          options: {
            delay: 1000,
            presence: 'composing'
          },
          textMessage: {
            text: content
          }
        })
      });
    } else {
      console.warn("Credenciais da Evolution API não encontradas. A mensagem foi salva no banco mas não foi disparada para o WhatsApp.");
    }

    return { success: true, message: msg };
  } catch (error) {
    console.error("Erro ao enviar mensagem manual:", error);
    return { error: "Falha ao enviar mensagem." };
  }
}