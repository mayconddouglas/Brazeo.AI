import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { getServiceSupabase } from "@/lib/supabase";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = getServiceSupabase();

  // Fetch basic stats
  const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: messagesCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });
  const { count: tasksDone } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('done', true);
  const { count: remindersActive } = await supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  // Fetch recent users
  const { data: recentUsers } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

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
            <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDone || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Lembretes Ativos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remindersActive || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Gráfico de atividade será renderizado aqui.</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Últimos Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentUsers?.map((u) => (
                <div key={u.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{u.name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{u.phone}</p>
                  </div>
                  <div className="ml-auto font-medium text-sm text-green-500">
                    {u.status === 'active' ? 'Ativo' : u.status}
                  </div>
                </div>
              ))}
              {!recentUsers?.length && (
                <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
