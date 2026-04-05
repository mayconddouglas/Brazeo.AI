"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createBroadcastAction(formData: FormData, selectedUserIds: string[]) {
  const supabase = getServiceSupabase();
  
  const target = formData.get("target") as string;
  const message = formData.get("message") as string;
  const schedule = formData.get("schedule") as string;

  if (!message) return { error: "Mensagem é obrigatória" };
  if (target === "specific" && selectedUserIds.length === 0) {
    return { error: "Selecione pelo menos um usuário." };
  }

  const scheduledAt = schedule ? new Date(schedule).toISOString() : null;
  const isImmediate = !scheduledAt;

  const { data: broadcast, error } = await supabase.from("broadcasts").insert([{
    message,
    target,
    target_users: target === "specific" ? selectedUserIds : null,
    scheduled_at: scheduledAt,
    status: isImmediate ? "processing" : "scheduled",
  }]).select().single();

  if (error) {
    console.error("Erro ao criar broadcast:", error);
    return { error: "Erro ao salvar broadcast." };
  }

  if (isImmediate) {
    // Disparar envio em background
    processBroadcast(broadcast.id).catch(console.error);
  }

  revalidatePath("/dashboard/broadcast");
  return { success: true, isImmediate };
}

export async function deleteBroadcastAction(id: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from("broadcasts").delete().eq("id", id);
  if (error) return { error: "Erro ao excluir." };
  revalidatePath("/dashboard/broadcast");
  return { success: true };
}

export async function sendNowAction(id: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("broadcasts")
    .update({ status: "processing", scheduled_at: null })
    .eq("id", id);
    
  if (error) return { error: "Erro ao atualizar status." };
  
  processBroadcast(id).catch(console.error);
  revalidatePath("/dashboard/broadcast");
  return { success: true };
}

// O motor de envio real (pode ser chamado pela Server Action ou pelo Cron Job)
export async function processBroadcast(broadcastId: string) {
  const supabase = getServiceSupabase();
  
  const { data: broadcast } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("id", broadcastId)
    .single();

  if (!broadcast || broadcast.status === "sent") return;

  let users = [];
  
  if (broadcast.target === "all") {
    const { data } = await supabase.from("users").select("*").eq("status", "active");
    users = data || [];
  } else if (broadcast.target === "specific" && broadcast.target_users?.length > 0) {
    const { data } = await supabase.from("users").select("*").in("id", broadcast.target_users);
    users = data || [];
  }

  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiUrl || !apiKey || !instance) {
    console.warn("Credenciais da Evolution API não configuradas. Simulando envio.");
    await supabase.from("broadcasts").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", broadcastId);
    return;
  }

  // Disparo das mensagens
  const promises = users.map(async (user) => {
    // Substitui variáveis como {nome} pelo nome do usuário
    const firstName = user.name ? user.name.split(" ")[0] : "Cliente";
    const personalizedMessage = broadcast.message.replace(/\{nome\}/gi, firstName);

    try {
      await fetch(`${apiUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number: user.phone,
          options: {
            delay: 1500, // delay aleatório para evitar ban?
            presence: 'composing'
          },
          textMessage: {
            text: personalizedMessage
          }
        })
      });
      
      // Salvar a mensagem no histórico individual de cada usuário (opcional, mas bom para a aba Conversas)
      await supabase.from("messages").insert([{
        user_id: user.id,
        role: "assistant",
        content: personalizedMessage,
        intent: "broadcast"
      }]);
      
    } catch (err) {
      console.error(`Erro ao enviar para ${user.phone}:`, err);
    }
  });

  // Aguarda todos os disparos terminarem (para uma lista muito grande, ideal é usar batching)
  await Promise.allSettled(promises);

  // Atualiza o status do broadcast para enviado
  await supabase
    .from("broadcasts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", broadcastId);
    
  revalidatePath("/dashboard/broadcast");
}