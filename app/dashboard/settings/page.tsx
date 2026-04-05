import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServiceSupabase } from "@/lib/supabase";
import { SettingsForm } from "./settings-form";
import { WebhookModal } from "./webhook-modal";

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = getServiceSupabase();

  const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();

  const hasEvolutionApi = !!process.env.EVOLUTION_API_KEY && !!process.env.EVOLUTION_API_URL;
  const hasOpenRouterApi = !!process.env.OPENROUTER_API_KEY;
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
                  <div className="font-medium">Evolution API (WhatsApp)</div>
                  <div className="text-sm text-muted-foreground">
                    {hasEvolutionApi ? `Conectado à instância '${process.env.EVOLUTION_INSTANCE_NAME || 'padrão'}'` : 'Não configurado nas variáveis de ambiente'}
                  </div>
                </div>
                <WebhookModal siteUrl={siteUrl} />
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-0.5">
                  <div className="font-medium">OpenRouter API (OpenAI)</div>
                  <div className="text-sm text-muted-foreground">
                    {hasOpenRouterApi ? 'Chave de API detectada' : 'Não configurado nas variáveis de ambiente'}
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={hasOpenRouterApi}>{hasOpenRouterApi ? 'Ativo' : 'Configurar'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
