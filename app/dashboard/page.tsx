import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, MessageSquare, Send, Clock } from "lucide-react";
import { getServiceSupabase } from "@/lib/supabase";
import { DashboardChart } from "@/components/dashboard-chart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = getServiceSupabase();

  // Fetch basic stats
  const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: messagesCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
  const { count: broadcastsCount } = await supabase.from('broadcasts').select('*', { count: 'exact', head: true }).eq('status', 'sent');
  const { count: remindersActive } = await supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  // Fetch recent interactions (Messages with User Data)
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*, users(name, phone)')
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(6);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Mensagens Trocadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messagesCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Disparos Concluídos</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{broadcastsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Campanhas ativas finalizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Lembretes Ativos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remindersActive || 0}</div>
            <p className="text-xs text-muted-foreground">Na fila do assistente virtual</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <DashboardChart data={[]} />
        </div>
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Últimas Interações</CardTitle>
            <CardDescription>Mensagens recentes recebidas pelo assistente.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6">
              {recentMessages?.map((msg: any) => {
                const user = msg.users || {};
                const name = user.name || "Desconhecido";
                const initials = name.substring(0, 2).toUpperCase();
                
                return (
                  <div key={msg.id} className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none truncate">{name}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {msg.content}
                        </p>
                        {msg.intent && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-auto whitespace-nowrap">
                            {msg.intent.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {!recentMessages?.length && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma interação recente.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
