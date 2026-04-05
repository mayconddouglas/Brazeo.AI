"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function saveSettingsAction(formData: FormData) {
  const supabase = getServiceSupabase();
  
  const agent_name = formData.get("agent_name") as string;
  const agent_tone = formData.get("agent_tone") as string;
  const agent_instructions = formData.get("agent_instructions") as string;

  if (!agent_name) return { error: "Nome do agente é obrigatório." };

  const { error } = await supabase
    .from("settings")
    .upsert({
      id: 1, // Sempre atualiza a mesma linha
      agent_name,
      agent_tone,
      agent_instructions,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error("Erro ao salvar configs:", error);
    return { error: "Erro ao salvar configurações no banco de dados." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}