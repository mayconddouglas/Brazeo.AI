import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BroadcastPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Broadcast</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nova Mensagem</CardTitle>
            <CardDescription>Envie uma mensagem para múltiplos usuários.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="target" className="text-sm font-medium">Público Alvo</label>
                <select id="target" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="all">Todos os Usuários Ativos</option>
                  <option value="specific">Usuários Específicos</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium">Mensagem</label>
                <textarea 
                  id="message" 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Digite sua mensagem aqui..."
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="schedule" className="text-sm font-medium">Agendamento (Opcional)</label>
                <input 
                  type="datetime-local" 
                  id="schedule" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <Button type="button" className="mt-2">Enviar Broadcast</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Envios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-1 border-b pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Atualização do Sistema</span>
                  <span className="text-xs text-muted-foreground">Ontem, 14:00</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Olá! O Brazeo.IA acabou de receber uma atualização e agora pode resumir áudios longos.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500/20 text-green-700">
                    Enviado (12)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
