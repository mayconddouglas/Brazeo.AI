"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function saveEvolutionKeysAction(formData: FormData) {
  const supabase = getServiceSupabase();
  
  const evolution_api_url = formData.get("evolution_api_url") as string;
  const evolution_api_key = formData.get("evolution_api_key") as string;
  const evolution_instance_name = formData.get("evolution_instance_name") as string;

  const { error } = await supabase
    .from("settings")
    .update({
      evolution_api_url: evolution_api_url || null,
      evolution_api_key: evolution_api_key || null,
      evolution_instance_name: evolution_instance_name || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    console.error("Erro ao salvar chaves da Evolution:", error);
    return { error: `Erro do Banco: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveOpenRouterKeyAction(formData: FormData) {
  const supabase = getServiceSupabase();
  
  const openrouter_api_key = formData.get("openrouter_api_key") as string;

  const { error } = await supabase
    .from("settings")
    .update({
      openrouter_api_key: openrouter_api_key || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    console.error("Erro ao salvar chave do OpenRouter:", error);
    return { error: `Erro do Banco: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveSettingsAction(formData: FormData) {
  const supabase = getServiceSupabase();
  
  const agent_name = formData.get("agent_name") as string;
  const agent_tone = formData.get("agent_tone") as string;
  const agent_instructions = formData.get("agent_instructions") as string;

  if (!agent_name) return { error: "Nome do agente é obrigatório." };

  const { error } = await supabase
    .from("settings")
    .update({
      agent_name,
      agent_tone,
      agent_instructions,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    console.error("Erro ao salvar configs:", error);
    return { error: `Erro do Banco: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}