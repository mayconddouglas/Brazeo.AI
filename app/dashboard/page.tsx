import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, MessageSquare, Send, Clock, TrendingUp, Activity, ArrowUpRight } from "lucide-react";
import { getServiceSupabase } from "@/lib/supabase";
import { DashboardChart } from "@/components/dashboard-chart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Header Greeting */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
        <p className="text-muted-foreground">Bem-vindo de volta! Aqui está o resumo do seu assistente virtual hoje.</p>
      </div>

      {/* Top Cards: KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{usersCount || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+12%</span>&nbsp;este mês
            </p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mensagens Trocadas</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{messagesCount || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Activity className="h-3 w-3 mr-1 text-blue-500" />
              Alto engajamento hoje
            </p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disparos Concluídos</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full">
              <Send className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{broadcastsCount || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Campanhas ativas finalizadas
            </p>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lembretes Ativos</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-full">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{remindersActive || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Na fila do assistente virtual
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Middle Row: Gráficos e Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 flex flex-col">
          <DashboardChart data={[]} />
        </div>
        
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Uso por Intenção
            </CardTitle>
            <CardDescription>Distribuição dos comandos mais reconhecidos pela IA.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Agendar / Lembrete</span>
                  <span className="text-sm font-semibold text-primary">45%</span>
                </div>
                <Progress value={45} className="h-2 bg-muted/50" />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bate-papo Livre</span>
                  <span className="text-sm font-semibold text-primary">25%</span>
                </div>
                <Progress value={25} className="h-2 bg-muted/50" />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Resumir Texto</span>
                  <span className="text-sm font-semibold text-primary">15%</span>
                </div>
                <Progress value={15} className="h-2 bg-muted/50" />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Consultoria</span>
                  <span className="text-sm font-semibold text-primary">10%</span>
                </div>
                <Progress value={10} className="h-2 bg-muted/50" />
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Planejamento</span>
                  <span className="text-sm font-semibold text-primary">5%</span>
                </div>
                <Progress value={5} className="h-2 bg-muted/50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Interações e Taxa de Sucesso */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Últimas Interações</CardTitle>
            <CardDescription>Mensagens recentes recebidas pelo assistente nas últimas horas.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {recentMessages?.map((msg: any) => {
                const user = msg.users || {};
                const name = user.name || "Desconhecido";
                const initials = name.substring(0, 2).toUpperCase();
                
                return (
                  <div key={msg.id} className="flex items-start gap-4 p-3 rounded-xl transition-colors hover:bg-muted/50 border border-transparent hover:border-border">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold leading-none truncate">{name}</p>
                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap ml-2 bg-muted px-2 py-0.5 rounded-full">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <p className="text-sm text-foreground/80 truncate max-w-[250px] md:max-w-[350px]">
                          {msg.content}
                        </p>
                        {msg.intent && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 mt-1 sm:mt-0 sm:ml-auto whitespace-nowrap font-medium text-primary border-primary/20 bg-primary/5">
                            {msg.intent.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {!recentMessages?.length && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Nenhuma interação recente.</p>
                  <p className="text-xs mt-1">Quando os usuários enviarem mensagens, elas aparecerão aqui.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-background border-emerald-500/20">
          <div className="absolute -right-10 -top-10 bg-emerald-500/10 h-40 w-40 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 bg-primary/10 h-40 w-40 rounded-full blur-3xl"></div>
          
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              Taxa de Sucesso
            </CardTitle>
            <CardDescription>Eficácia geral da inteligência artificial.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 h-[calc(100%-80px)] relative z-10">
            <div className="relative flex items-center justify-center h-48 w-48 rounded-full border-8 border-emerald-500/20">
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-500" strokeDasharray="289" strokeDashoffset="17" strokeLinecap="round" />
              </svg>
              <div className="flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold tracking-tighter bg-gradient-to-br from-emerald-400 to-emerald-700 bg-clip-text text-transparent">
                  94%
                </span>
              </div>
            </div>
            <div className="mt-8 text-center space-y-1">
              <p className="font-semibold text-foreground">Excelente Desempenho</p>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                das intenções foram compreendidas e respondidas corretamente sem intervenção humana.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
