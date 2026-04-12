"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function saveEvolutionKeysAction(formData: FormData) {
  const supabase = getServiceSupabase();
  
  const evolution_api_url = formData.get("evolution_api_url") as string;
  const evolution_api_key = formData.get("evolution_api_key") as string;
  const evolution_instance_name = formData.get("evolution_instance_name") as string;
  const siteUrl = formData.get("siteUrl") as string;

  // Se o usuário preencheu os 3, tentamos configurar o Webhook na Evolution
  if (evolution_api_url && evolution_api_key && evolution_instance_name && siteUrl) {
    try {
      const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/webhook/evolution`;
      const url = `${evolution_api_url.replace(/\/$/, '')}/webhook/set/${evolution_instance_name}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": evolution_api_key,
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            byEvents: false,
            base64: true,
            events: ["MESSAGES_UPSERT"],
          },
        }),
      });

      if (!response.ok) {
        let errorData = await response.text();
        try {
          const parsed = JSON.parse(errorData);
          if (parsed.message) errorData = parsed.message;
        } catch {}
        console.error("Evolution Webhook Set Error:", errorData);
        return { error: `Erro na Evolution API: ${errorData}` };
      }
    } catch (e: any) {
      console.error("Evolution Webhook fetch error:", e);
      return { error: `Falha ao conectar com a Evolution API: ${e.message}` };
    }
  }

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
  const openai_api_key = formData.get("openai_api_key") as string;
  const groq_api_key = formData.get("groq_api_key") as string;
  const tavily_api_key = formData.get("tavily_api_key") as string;

  const { error } = await supabase
    .from("settings")
    .update({
      openrouter_api_key: openrouter_api_key || null,
      openai_api_key: openai_api_key || null,
      groq_api_key: groq_api_key || null,
      tavily_api_key: tavily_api_key || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    console.error("Erro ao salvar chaves de IA:", error);
    return { error: `Erro do Banco: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveBehaviorSettingsAction(formData: FormData) {
  const supabase = getServiceSupabase();
  
  const updates: any = { updated_at: new Date().toISOString() };
  
  const fields = ['planner_active', 'morning_message_active', 'internet_search_active', 'feedback_active'];
  
  fields.forEach(field => {
    if (formData.has(field)) {
      updates[field] = formData.get(field) === 'true';
    }
  });

  const { error } = await supabase
    .from("settings")
    .update(updates)
    .eq("id", 1);

  if (error) {
    console.error("Erro ao salvar comportamento:", error);
    return { error: `Erro do Banco: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function resetSettingsAction() {
  const supabase = getServiceSupabase();
  
  const { error } = await supabase
    .from("settings")
    .update({
      agent_name: 'Brazeo.IA',
      agent_tone: 'friendly',
      agent_instructions: 'Você é um assistente virtual prestativo, educado e focado em resolver os problemas do cliente de forma rápida.',
      evolution_api_url: null,
      evolution_api_key: null,
      evolution_instance_name: null,
      openrouter_api_key: null,
      openai_api_key: null,
      groq_api_key: null,
      tavily_api_key: null,
      planner_active: true,
      morning_message_active: true,
      internet_search_active: true,
      feedback_active: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    console.error("Erro ao resetar configs:", error);
    return { error: `Erro do Banco: ${error.message}` };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function saveNotificationsAction(formData: FormData) {
  const supabase = getServiceSupabase();
  
  const planner_time = formData.get("planner_time") as string;
  const morning_time = formData.get("morning_time") as string;
  const summary_time = formData.get("summary_time") as string;
  const feedback_interval = parseInt(formData.get("feedback_interval") as string, 10);

  const { error } = await supabase
    .from("settings")
    .update({
      planner_time: planner_time || "08:00",
      morning_time: morning_time || "08:00",
      summary_time: summary_time || "18:00",
      feedback_interval: isNaN(feedback_interval) ? 3 : feedback_interval,
      updated_at: new Date().toISOString()
    })
    .eq("id", 1);

  if (error) {
    console.error("Erro ao salvar notificações:", error);
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