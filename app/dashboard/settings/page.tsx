import { getServiceSupabase } from "@/lib/supabase";
import { SettingsForm } from "./settings-form";
import { IntegrationCards } from "./integration-cards";
import { BehaviorSettings } from "./behavior-settings";
import { DangerZone } from "./danger-zone";

export const revalidate = 0;

/*
SQL de Migração para colunas booleanas de comportamento:

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS planner_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS morning_message_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS internet_search_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS feedback_active BOOLEAN DEFAULT true;
*/

export default async function SettingsPage() {
  const supabase = getServiceSupabase();

  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
      </div>
      
      {/* SEÇÃO 1 — PERFIL DO AGENTE */}
      <section>
        <SettingsForm initialData={settings} />
      </section>

      {/* SEÇÃO 2 — INTEGRAÇÕES */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-medium">Integrações</h3>
          <p className="text-sm text-muted-foreground">Conecte a Safira aos serviços externos e modelos de IA.</p>
        </div>
        <IntegrationCards settings={settings} siteUrl={siteUrl} />
      </section>

      {/* SEÇÃO 3 — LIMITES E COMPORTAMENTO */}
      <section>
        <BehaviorSettings settings={settings} />
      </section>

      {/* SEÇÃO 4 — ZONA DE PERIGO */}
      <section>
        <DangerZone />
      </section>
    </div>
  );
}
