import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const hasEvolutionApi = !!process.env.EVOLUTION_API_KEY && !!process.env.EVOLUTION_API_URL;
  const hasOpenRouterApi = !!process.env.OPENROUTER_API_KEY;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Perfil do Agente</CardTitle>
            <CardDescription>Configure como o agente se apresenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium">Nome do Agente</label>
                <input 
                  id="name" 
                  defaultValue="Brazeo.IA"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="tone" className="text-sm font-medium">Tom de Resposta</label>
                <select id="tone" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="friendly">Amigável e Direto</option>
                  <option value="formal">Formal</option>
                  <option value="fun">Divertido</option>
                </select>
              </div>
              
              <Button type="button" className="mt-2 w-fit">Salvar Alterações</Button>
            </form>
          </CardContent>
        </Card>
        
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
                <Button variant="outline" size="sm" disabled={hasEvolutionApi}>{hasEvolutionApi ? 'Ativo' : 'Configurar'}</Button>
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
