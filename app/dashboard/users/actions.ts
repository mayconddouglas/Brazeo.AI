"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addUser(formData: FormData) {
  const supabase = getServiceSupabase();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  if (!phone) return { error: "Telefone é obrigatório" };

  const { error } = await supabase.from("users").insert([{ name, phone, status: "active" }]);

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: "Este telefone já está cadastrado." };
    }
    return { error: "Erro ao adicionar usuário." };
  }

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function updateUserNotesAction(userId: string, notes: string) {
  const supabase = getServiceSupabase();
  
  if (!userId) return { error: "ID do usuário é obrigatório" };

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", userId)
    .single();

  if (userError || !user) return { error: "Usuário não encontrado." };

  const prefs = user.preferences || {};
  prefs.admin_notes = notes;

  const { error: updateError } = await supabase
    .from("users")
    .update({ preferences: prefs })
    .eq("id", userId);

  if (updateError) return { error: "Erro ao salvar notas." };

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function getUserMessagesAction(userId: string) {
  const supabase = getServiceSupabase();
  
  if (!userId) return [];

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Erro ao buscar mensagens do usuário:", error);
    return [];
  }

  return data || [];
}

export async function deleteUser(id: string) {
  const supabase = getServiceSupabase();
  
  if (!id) return { error: "ID é obrigatório" };

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) return { error: "Erro ao excluir usuário." };

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function updateUser(formData: FormData) {
  const supabase = getServiceSupabase();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const status = formData.get("status") as string;

  if (!id) return { error: "ID é obrigatório" };

  const { error } = await supabase
    .from("users")
    .update({ name, phone, status })
    .eq("id", id);

  if (error) return { error: "Erro ao atualizar usuário." };

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function approveUserAction(id: string) {
  const supabase = getServiceSupabase();
  
  if (!id) return { error: "ID é obrigatório" };

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (userError || !user) return { error: "Usuário não encontrado." };

  const { error: updateError } = await supabase
    .from("users")
    .update({ status: "active" })
    .eq("id", id);

  if (updateError) return { error: "Erro ao aprovar usuário." };

  // Get settings to send message via Evolution API
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
  const apiUrl = settings?.evolution_api_url || process.env.EVOLUTION_API_URL;
  const apiKey = settings?.evolution_api_key || process.env.EVOLUTION_API_KEY;
  const instance = settings?.evolution_instance_name || process.env.EVOLUTION_INSTANCE_NAME;

  if (apiUrl && apiKey && instance) {
    const name = user.name ? `, ${user.name}` : '';
    const text = `Boa notícia${name}! 🎉\nSeu acesso à Safira foi aprovado!\nPode me mandar uma mensagem pra começarmos. 😊`;

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
            delay: 1200,
            presence: 'composing'
          },
          textMessage: {
            text: text
          }
        })
      });
    } catch (error) {
      console.error('Error sending WhatsApp approval message:', error);
    }
  }

  revalidatePath("/dashboard/users");
  return { success: true };
}