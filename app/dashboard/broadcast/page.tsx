import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServiceSupabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export default async function BroadcastPage() {
  const supabase = getServiceSupabase();

  // Fetch broadcasts history
  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  // Server action to create a new broadcast
  async function createBroadcast(formData: FormData) {
    "use server";
    const supabaseService = getServiceSupabase();
    
    const target = formData.get("target") as string;
    const message = formData.get("message") as string;
    const schedule = formData.get("schedule") as string;

    if (!message) return;

    await supabaseService.from("broadcasts").insert([{
      message,
      target,
      scheduled_at: schedule ? new Date(schedule).toISOString() : null,
      status: schedule ? "scheduled" : "draft", // Would be "sent" if we triggered the API here
    }]);

    revalidatePath("/dashboard/broadcast");
  }

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
            <form action={createBroadcast} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="target" className="text-sm font-medium">Público Alvo</label>
                <select name="target" id="target" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="all">Todos os Usuários Ativos</option>
                  <option value="specific">Usuários Específicos</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium">Mensagem</label>
                <textarea 
                  name="message"
                  id="message" 
                  required
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Digite sua mensagem aqui..."
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="schedule" className="text-sm font-medium">Agendamento (Opcional)</label>
                <input 
                  type="datetime-local" 
                  name="schedule"
                  id="schedule" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <Button type="submit" className="mt-2">Salvar / Enviar Broadcast</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Envios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {broadcasts?.map((broadcast) => (
                <div key={broadcast.id} className="flex flex-col gap-1 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Para: {broadcast.target === 'all' ? 'Todos os Usuários' : broadcast.target}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {broadcast.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${broadcast.status === 'sent' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}`}>
                      {broadcast.status === 'draft' ? 'Rascunho' : broadcast.status === 'scheduled' ? 'Agendado' : 'Enviado'}
                    </span>
                    {broadcast.scheduled_at && (
                       <span className="text-xs text-muted-foreground">
                         Agendado para: {new Date(broadcast.scheduled_at).toLocaleString('pt-BR')}
                       </span>
                    )}
                  </div>
                </div>
              ))}
              {!broadcasts?.length && (
                <div className="text-sm text-muted-foreground text-center p-4">
                  Nenhum broadcast encontrado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
