import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServiceSupabase();
  
  let supabaseStatus = "online";
  let openrouterStatus = "pending";
  let tavilyStatus = "pending";
  let evolutionStatus = "disconnected";

  try {
    // 3. Supabase Check
    const { data: settings, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error || !settings) {
      supabaseStatus = "error";
    } else {
      // 2. OpenRouter Check
      if (settings.openrouter_api_key && settings.openrouter_api_key.trim() !== "") {
        openrouterStatus = "configured";
      }

      // 4. Tavily Check
      if (settings.tavily_api_key && settings.tavily_api_key.trim() !== "") {
        tavilyStatus = "configured";
      }

      // 1. Evolution API Check
      if (settings.evolution_api_url && settings.evolution_instance_name && settings.evolution_api_key) {
        try {
          const baseUrl = settings.evolution_api_url.replace(/\/$/, "");
          const res = await fetch(`${baseUrl}/instance/connectionState/${settings.evolution_instance_name}`, {
            headers: {
              "apikey": settings.evolution_api_key
            },
            cache: 'no-store'
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data?.instance?.state === "open") {
              evolutionStatus = "connected";
            }
          }
        } catch (e) {
          // Keep disconnected
        }
      }
    }
  } catch (e) {
    supabaseStatus = "error";
  }

  return NextResponse.json({
    supabase: supabaseStatus,
    openrouter: openrouterStatus,
    tavily: tavilyStatus,
    evolution: evolutionStatus
  });
}