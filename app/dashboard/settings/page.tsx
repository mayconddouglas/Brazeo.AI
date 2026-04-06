import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getServiceSupabase } from "@/lib/supabase";
import { SettingsForm } from "./settings-form";
import { WebhookModal } from "./webhook-modal";
import { EvolutionModal, OpenRouterModal } from "./integration-modals";

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = getServiceSupabase();

  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();

  const hasEvolutionApi = !!settings?.evolution_api_key || (!!process.env.EVOLUTION_API_KEY && !!process.env.EVOLUTION_API_URL);
  const hasOpenRouterApi = !!settings?.openrouter_api_key || !!process.env.OPENROUTER_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <SettingsForm initialData={settings} />
        
        <Card>
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
            <CardDescription>Gerencie as conexões de API.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-0.5">
                  <div className="font-medium flex items-center gap-2">
                    Evolution API (WhatsApp)
                    {hasEvolutionApi && <span className="inline-flex h-2 w-2 rounded-full bg-green-500" title="Ativo" />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hasEvolutionApi ? `Conectado à instância '${settings?.evolution_instance_name || process.env.EVOLUTION_INSTANCE_NAME || 'padrão'}'` : 'Não configurado'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <WebhookModal siteUrl={siteUrl} />
                  <EvolutionModal initialData={settings} siteUrl={siteUrl} />
                </div>
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-0.5">
                  <div className="font-medium flex items-center gap-2">
                    OpenRouter API (OpenAI)
                    {hasOpenRouterApi && <span className="inline-flex h-2 w-2 rounded-full bg-green-500" title="Ativo" />}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {hasOpenRouterApi ? 'Chave de API detectada' : 'Não configurado'}
                  </div>
                </div>
                <OpenRouterModal initialData={settings} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
