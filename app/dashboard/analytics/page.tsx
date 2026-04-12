import { getServiceSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Users, Activity, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

type PeriodType = 'today' | '7d' | '30d' | '90d';

const getStartDate = (period: PeriodType) => {
  const now = new Date();
  switch (period) {
    case 'today':
      now.setHours(0, 0, 0, 0);
      return now;
    case '7d':
      now.setDate(now.getDate() - 7);
      return now;
    case '30d':
      now.setDate(now.getDate() - 30);
      return now;
    case '90d':
      now.setDate(now.getDate() - 90);
      return now;
    default:
      now.setDate(now.getDate() - 7);
      return now;
  }
};

const intentLabels: Record<string, string> = {
  'criar_lembrete': 'Lembretes',
  'planejar_semana': 'Planejador',
  'resposta_livre': 'Conversa Livre',
  'pesquisa_internet': 'Pesquisa Web',
  'suporte': 'Suporte',
  'saudacao': 'Saudação',
};

function formatIntentName(intent: string) {
  if (!intent) return 'Outros';
  return intentLabels[intent] || intent.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function AnalyticsPage(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  const searchParams = await props.searchParams;
  const period = (searchParams.period as PeriodType) || '7d';
  const startDate = getStartDate(period);
  const supabase = getServiceSupabase();

  // 1. Fetch Messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, user_id, intent, created_at')
    .gte('created_at', startDate.toISOString());

  const msgs = messages || [];

  // KPI 1: Total Messages
  const totalMessages = msgs.length;

  // KPI 2: Unique Active Users
  const uniqueUsers = new Set(msgs.map(m => m.user_id)).size;

  // KPI 3: Top Intent & Chart Data
  const intentCounts: Record<string, number> = {};
  msgs.forEach(m => {
    const key = m.intent || 'outros';
    intentCounts[key] = (intentCounts[key] || 0) + 1;
  });

  const sortedIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([intent, count]) => ({
      name: formatIntentName(intent),
      value: count,
      rawIntent: intent
    }));

  const topIntent = sortedIntents.length > 0 && sortedIntents[0].rawIntent !== 'outros' 
    ? sortedIntents[0].name 
    : (sortedIntents.length > 1 ? sortedIntents[1].name : 'N/A');

  // KPI 4: Peak Hour & Heatmap Data
  const heatmapData = Array.from({ length: 7 }, () => Array(24).fill(0));
  const hourCounts = Array(24).fill(0);

  msgs.forEach(m => {
    const date = new Date(m.created_at);
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const hour = date.getHours(); // 0 to 23
    
    heatmapData[day][hour]++;
    hourCounts[hour]++;
  });

  let peakHourIdx = 0;
  let maxHourCount = 0;
  hourCounts.forEach((count, idx) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      peakHourIdx = idx;
    }
  });
  
  const peakHour = maxHourCount > 0 ? `${String(peakHourIdx).padStart(2, '0')}h - ${String(peakHourIdx + 1).padStart(2, '0')}h` : 'N/A';

  // Find max value for heatmap coloring
  let maxHeatmapVal = 0;
  heatmapData.forEach(day => day.forEach(val => {
    if (val > maxHeatmapVal) maxHeatmapVal = val;
  }));

  let feedbacksData: any[] = [];
  try {
    const { data } = await supabase
      .from('feedbacks')
      .select('*, users(name, phone)')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) feedbacksData = data;
  } catch (e) {
    // Fallback if table doesn't exist or other error
  }

  const recentFeedbacks = feedbacksData;

  const getEmoji = (score: number) => {
    if (score >= 3) return '🔥';
    if (score === 2) return '😐';
    return '😟';
  };

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Analytics da Safira</h2>
        
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Link href="?period=today" className="w-full h-full flex items-center justify-center">
            <Button variant={period === 'today' ? 'default' : 'ghost'} size="sm" type="button">Hoje</Button>
          </Link>
          <Link href="?period=7d" className="w-full h-full flex items-center justify-center">
            <Button variant={period === '7d' ? 'default' : 'ghost'} size="sm" type="button">7 dias</Button>
          </Link>
          <Link href="?period=30d" className="w-full h-full flex items-center justify-center">
            <Button variant={period === '30d' ? 'default' : 'ghost'} size="sm" type="button">30 dias</Button>
          </Link>
          <Link href="?period=90d" className="w-full h-full flex items-center justify-center">
            <Button variant={period === '90d' ? 'default' : 'ghost'} size="sm" type="button">90 dias</Button>
          </Link>
        </div>
      </div>

      {/* SEÇÃO 2: KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mensagens no Período</p>
              <h3 className="text-2xl font-bold mt-1">{totalMessages}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <MessageSquare className="size-5" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usuários Únicos</p>
              <h3 className="text-2xl font-bold mt-1">{uniqueUsers}</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full text-green-600">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Intent Mais Usado</p>
              <h3 className="text-xl font-bold mt-1 truncate max-w-[140px]" title={topIntent}>{topIntent}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-600">
              <Activity className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Horário de Pico</p>
              <h3 className="text-xl font-bold mt-1">{peakHour}</h3>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-600">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* SEÇÃO 3: Gráfico de Intents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Intents</CardTitle>
            <CardDescription>As intenções mais solicitadas pelos usuários.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedIntents.slice(0, 6).map((intent, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 truncate text-sm font-medium" title={intent.name}>
                    {intent.name}
                  </div>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${Math.max((intent.value / (sortedIntents[0]?.value || 1)) * 100, 2)}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-sm text-muted-foreground">
                    {intent.value}
                  </div>
                </div>
              ))}
              {sortedIntents.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Nenhum dado encontrado para o período.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 5: Feedbacks Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Feedbacks Recentes</CardTitle>
            <CardDescription>Últimas avaliações enviadas pelos usuários.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFeedbacks.length > 0 ? (
                recentFeedbacks.map((fb: any) => (
                  <div key={fb.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{fb.users?.name || fb.users?.phone || 'Usuário Desconhecido'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fb.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-2xl" title={`Nota: ${fb.score}`}>
                      {getEmoji(fb.score)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Nenhum feedback recebido ainda.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 4: Heatmap de uso por hora */}
      <Card>
        <CardHeader>
          <CardTitle>Intensidade de Uso (Heatmap)</CardTitle>
          <CardDescription>Volume de mensagens distribuído por dias da semana e horários.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pb-4">
          <div className="min-w-[700px]">
            <div className="flex mb-2">
              <div className="w-12"></div>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-muted-foreground">
                  {i}h
                </div>
              ))}
            </div>
            
            <div className="space-y-1">
              {heatmapData.map((dayData, dayIdx) => (
                <div key={dayIdx} className="flex items-center">
                  <div className="w-12 text-xs font-medium text-muted-foreground">
                    {daysOfWeek[dayIdx]}
                  </div>
                  {dayData.map((val, hourIdx) => {
                    const intensity = val === 0 ? 0 : Math.max(0.1, val / maxHeatmapVal);
                    
                    return (
                      <div 
                        key={hourIdx} 
                        className="flex-1 aspect-square m-0.5 rounded-sm border border-border/50 relative group cursor-pointer"
                        style={{ 
                          backgroundColor: val > 0 ? `hsl(var(--primary) / ${intensity})` : 'transparent' 
                        }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border text-xs rounded pointer-events-none z-10 whitespace-nowrap shadow-sm transition-opacity">
                          {val} msgs
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}