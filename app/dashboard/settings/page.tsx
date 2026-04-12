import { getServiceSupabase } from "@/lib/supabase";
import { SettingsForm } from "./settings-form";
import { IntegrationCards } from "./integration-cards";
import { BehaviorSettings } from "./behavior-settings";
import { DangerZone } from "./danger-zone";
import { NotificationsSettings } from "./notifications-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const revalidate = 0;

/*
SQL de Migração para colunas booleanas de comportamento e notificações:

ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS planner_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS morning_message_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS internet_search_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS feedback_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS planner_time VARCHAR(10) DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS morning_time VARCHAR(10) DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS summary_time VARCHAR(10) DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS feedback_interval INTEGER DEFAULT 3;
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
      
      <Tabs defaultValue="agent" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 mb-8">
          <TabsTrigger value="agent">Agente</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-6 mt-0">
          <SettingsForm initialData={settings} />
          <BehaviorSettings settings={settings} />
          <DangerZone />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6 mt-0">
          <div>
            <h3 className="text-lg font-medium">Integrações de IA e Sistemas</h3>
            <p className="text-sm text-muted-foreground">Conecte a Safira aos serviços externos e modelos LLM.</p>
          </div>
          <IntegrationCards settings={settings} siteUrl={siteUrl} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-0">
          <NotificationsSettings settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
