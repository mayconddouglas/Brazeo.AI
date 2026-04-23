import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, MessageSquare, Send, Clock, TrendingUp, TrendingDown, Activity, ArrowUpRight } from "lucide-react";
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
  const { data: usersData } = await supabase.from('users').select('created_at');
  const usersCount = usersData?.length || 0;

  // Calculate users growth (last 30 days vs previous 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  let currentPeriodUsers = 0;
  let previousPeriodUsers = 0;

  usersData?.forEach(u => {
    if (u.created_at) {
      const createdDate = new Date(u.created_at);
      if (createdDate >= thirtyDaysAgo) {
        currentPeriodUsers++;
      } else if (createdDate >= sixtyDaysAgo && createdDate < thirtyDaysAgo) {
        previousPeriodUsers++;
      }
    }
  });

  let usersGrowthStr = "Novo";
  let usersGrowthIsPositive = true;

  if (previousPeriodUsers > 0) {
    const growthVal = ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100;
    usersGrowthIsPositive = growthVal >= 0;
    usersGrowthStr = `${growthVal > 0 ? '+' : ''}${growthVal.toFixed(1)}%`;
  } else if (currentPeriodUsers === 0 && previousPeriodUsers === 0) {
    usersGrowthStr = "0%";
    usersGrowthIsPositive = true;
  }

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

  // Fetch intents and dates for "Uso por Intenção", "Taxa de Sucesso" and "Volume de Interações"
  const { data: userMessages } = await supabase
    .from('messages')
    .select('intent, created_at')
    .eq('role', 'user');

  const sevenDaysAgoForMood = new Date();
  sevenDaysAgoForMood.setDate(sevenDaysAgoForMood.getDate() - 7);

  const { data: moodLogs7d } = await supabase
    .from('mood_logs')
    .select('user_id, humor, created_at, users(name)')
    .gte('created_at', sevenDaysAgoForMood.toISOString());

  const totalUserMessages = userMessages?.length || 0;
  
  // Calculate success rate (messages that have an intent recognized, i.e., intent is not null and not 'fallback' or 'desconhecida')
  let successRate = 0;
  if (totalUserMessages > 0 && userMessages) {
    const successfulMessages = userMessages.filter(m => m.intent && m.intent !== 'fallback' && m.intent !== 'desconhecida').length;
    successRate = Math.round((successfulMessages / totalUserMessages) * 100);
  } else {
    // Se não houver mensagens, mostrar 100% ou 0%. Vamos manter 100% como otimismo ou 0.
    successRate = 0;
  }

  // Calculate intent usage
  const intentCounts: Record<string, number> = {};
  
  // Calculate chart data for the last 7 days and previous 7 days for growth
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d,
      dia: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).replace(/^\w/, c => c.toUpperCase()),
      mensagens: 0
    };
  });

  let currentWeekCount = 0;
  let previousWeekCount = 0;

  userMessages?.forEach(m => {
    if (m.intent) {
      intentCounts[m.intent] = (intentCounts[m.intent] || 0) + 1;
    }
    
    if (m.created_at) {
      const msgDate = new Date(m.created_at);
      
      // Calculate diff in days
      const diffTime = Math.abs(now.getTime() - msgDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        currentWeekCount++;
        // Find which day to increment in chart
        const dayObj = last7Days.find(d => 
          d.date.getDate() === msgDate.getDate() && 
          d.date.getMonth() === msgDate.getMonth() && 
          d.date.getFullYear() === msgDate.getFullYear()
        );
        if (dayObj) {
          dayObj.mensagens += 1;
        }
      } else if (diffDays > 7 && diffDays <= 14) {
        previousWeekCount++;
      }
    }
  });

  const chartData = last7Days.map(({ dia, mensagens }) => ({ dia, mensagens }));
  
  let growth = 0;
  if (previousWeekCount > 0) {
    growth = ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100;
  } else if (currentWeekCount > 0) {
    growth = 100; // 100% growth if there was nothing last week and something this week
  }

  // Sort intents by count descending and take top 5
  const topIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([intent, count]) => ({
      name: intent,
      percentage: Math.round((count / totalUserMessages) * 100)
    }));

  // Helper to format intent names
  const formatIntentName = (intent: string) => {
    return intent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calcula o valor do SVG Gauge (Circunferência total = 289, dashoffset vai de 289 (0%) até 0 (100%))
  const hasData = totalUserMessages > 0;
  const gaugeCircumference = 289;
  const gaugeOffset = gaugeCircumference - (successRate / 100) * gaugeCircumference;

  const wellbeingMoods = [
    { key: 'otimo', label: 'Ótimo', emoji: '😊', accent: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
    { key: 'bem', label: 'Bem', emoji: '🙂', accent: 'bg-sky-500/10 text-sky-700 border-sky-500/20' },
    { key: 'neutro', label: 'Neutro', emoji: '😐', accent: 'bg-muted text-muted-foreground border-border' },
    { key: 'estressado', label: 'Estressado', emoji: '😰', accent: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
    { key: 'triste', label: 'Triste', emoji: '😔', accent: 'bg-rose-500/10 text-rose-700 border-rose-500/20' },
  ] as const;

  const wellbeingCounts = wellbeingMoods.reduce((acc, m) => {
    acc[m.key] = 0;
    return acc;
  }, {} as Record<string, number>);

  moodLogs7d?.forEach((l: any) => {
    const k = l?.humor;
    if (k && typeof wellbeingCounts[k] === 'number') {
      wellbeingCounts[k] += 1;
    }
  });

  const wellbeingTotal = Object.values(wellbeingCounts).reduce((sum, v) => sum + v, 0);

  const threeDaysAgoForNegative = new Date();
  threeDaysAgoForNegative.setDate(threeDaysAgoForNegative.getDate() - 3);

  const negativeByUser = new Map<string, { userId: string; name: string; count: number }>();
  moodLogs7d?.forEach((l: any) => {
    if (!l?.created_at || !l?.user_id) return;
    const createdAt = new Date(l.created_at);
    if (createdAt < threeDaysAgoForNegative) return;
    if (l.humor !== 'estressado' && l.humor !== 'triste') return;

    const userId = l.user_id as string;
    const name = l.users?.name || "Desconhecido";
    const current = negativeByUser.get(userId);
    negativeByUser.set(userId, {
      userId,
      name,
      count: (current?.count || 0) + 1,
    });
  });

  const topNegativeUsers = Array.from(negativeByUser.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

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
              {usersGrowthIsPositive ? (
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={`${usersGrowthIsPositive ? 'text-emerald-500' : 'text-red-500'} font-medium`}>
                {usersGrowthStr}
              </span>&nbsp;este mês
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
        <div className="col-span-full lg:col-span-4 flex flex-col">
          <DashboardChart data={chartData} growth={growth} />
        </div>
        
        <Card className="col-span-full lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Uso por Intenção
            </CardTitle>
            <CardDescription>Distribuição dos comandos mais reconhecidos pela IA.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="space-y-6">
              {topIntents.length > 0 ? (
                topIntents.map((intent, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate pr-4">{formatIntentName(intent.name)}</span>
                      <span className="text-sm font-semibold text-primary">{intent.percentage}%</span>
                    </div>
                    <Progress value={intent.percentage} className="h-2 bg-muted/50" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                  <Activity className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium text-foreground/70">Sem dados suficientes.</p>
                  <p className="text-xs mt-1 max-w-[200px] mx-auto">As intenções aparecerão aqui quando a IA começar a responder.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Interações e Taxa de Sucesso */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 flex flex-col">
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
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                  <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium text-foreground/70">Nenhuma interação recente.</p>
                  <p className="text-xs mt-1 max-w-[250px] mx-auto">Quando os usuários enviarem mensagens, elas aparecerão aqui.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`col-span-full lg:col-span-3 relative overflow-hidden bg-gradient-to-br to-background border ${
          !hasData ? 'from-muted/50 via-muted/20 border-muted' :
          successRate > 80 ? 'from-emerald-500/10 via-emerald-500/5 border-emerald-500/20' :
          successRate > 50 ? 'from-amber-500/10 via-amber-500/5 border-amber-500/20' :
          'from-red-500/10 via-red-500/5 border-red-500/20'
        }`}>
          <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${
            !hasData ? 'bg-muted/50' :
            successRate > 80 ? 'bg-emerald-500/10' :
            successRate > 50 ? 'bg-amber-500/10' :
            'bg-red-500/10'
          }`}></div>
          <div className={`absolute -left-10 -bottom-10 h-40 w-40 rounded-full blur-3xl ${
            !hasData ? 'bg-muted/50' : 'bg-primary/10'
          }`}></div>
          
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className={`h-5 w-5 ${!hasData ? 'text-muted-foreground' : successRate > 80 ? 'text-emerald-500' : successRate > 50 ? 'text-amber-500' : 'text-red-500'}`} />
              Taxa de Sucesso
            </CardTitle>
            <CardDescription>Eficácia geral da inteligência artificial.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 flex-1 relative z-10">
            <div className={`relative flex items-center justify-center h-48 w-48 rounded-full border-8 ${
              !hasData ? 'border-muted' :
              successRate > 80 ? 'border-emerald-500/20' :
              successRate > 50 ? 'border-amber-500/20' :
              'border-red-500/20'
            }`}>
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  className={!hasData ? 'text-muted-foreground/20' : successRate > 80 ? 'text-emerald-500' : successRate > 50 ? 'text-amber-500' : 'text-red-500'} 
                  strokeDasharray="289" strokeDashoffset={!hasData ? 289 : gaugeOffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }} />
              </svg>
              <div className="flex flex-col items-center justify-center">
                <span className={`text-5xl font-extrabold tracking-tighter bg-gradient-to-br bg-clip-text text-transparent ${
                  !hasData ? 'from-muted-foreground to-muted-foreground/50' :
                  successRate > 80 ? 'from-emerald-400 to-emerald-700' :
                  successRate > 50 ? 'from-amber-400 to-amber-700' :
                  'from-red-400 to-red-700'
                }`}>
                  {hasData ? `${successRate}%` : '--'}
                </span>
              </div>
            </div>
            <div className="mt-8 text-center space-y-1">
              <p className="font-semibold text-foreground">
                {!hasData ? 'Aguardando Interações' : successRate > 80 ? 'Excelente Desempenho' : successRate > 50 ? 'Desempenho Regular' : 'Atenção Necessária'}
              </p>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                {!hasData 
                  ? 'O gráfico será preenchido assim que os usuários interagirem.' 
                  : 'das intenções foram compreendidas e respondidas corretamente sem intervenção humana.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Termômetro de Bem-estar</CardTitle>
          <CardDescription>Leitura rápida do humor dos usuários para identificar quem pode precisar de mais atenção.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {wellbeingMoods.map((m) => {
              const count = wellbeingCounts[m.key] || 0;
              const pct = wellbeingTotal > 0 ? Math.round((count / wellbeingTotal) * 100) : 0;

              return (
                <Card key={m.key} className="shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-md border ${m.accent}`}>
                        <span className="text-base leading-none">{m.emoji}</span>
                        <span>{m.label}</span>
                      </div>
                      <span className="text-2xl font-bold tabular-nums">{count}</span>
                    </div>
                    <div className="space-y-1">
                      <Progress value={pct} className="h-2 bg-muted/50" />
                      <p className="text-[11px] text-muted-foreground">{pct}% dos registros (7 dias)</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Top 3 usuários com humor negativo (últimos 3 dias)</h3>
              <Badge variant="outline" className="border-orange-500/20 bg-orange-500/10 text-orange-700">
                Alerta
              </Badge>
            </div>
            <div className="space-y-2">
              {topNegativeUsers.map((u) => {
                const initials = (u.name || "U").substring(0, 2).toUpperCase();
                return (
                  <div key={u.userId} className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 border shadow-sm">
                        <AvatarFallback className="bg-orange-500/10 text-orange-700 font-semibold text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{u.name}</span>
                        <span className="text-xs text-muted-foreground truncate">Registros negativos: {u.count}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-orange-500/20 bg-orange-500/10 text-orange-700 whitespace-nowrap">
                      Atenção
                    </Badge>
                  </div>
                );
              })}

              {!topNegativeUsers.length && (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                  <p className="text-sm font-medium text-foreground/70">Sem alertas no momento.</p>
                  <p className="text-xs mt-1 max-w-[320px] mx-auto">Nenhum usuário teve muitos registros de estresse/tristeza nos últimos 3 dias.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
