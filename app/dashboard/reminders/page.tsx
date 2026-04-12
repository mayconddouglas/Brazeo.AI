import { getServiceSupabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { CancelButton } from "./cancel-button";

export const revalidate = 0;

function formatReminderDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.getDate() === tomorrow.getDate() && date.getMonth() === tomorrow.getMonth() && date.getFullYear() === tomorrow.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}h${minutes}`;

  if (isToday) return `Hoje às ${time}`;
  if (isTomorrow) return `Amanhã às ${time}`;

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} às ${time}`;
}

export default async function RemindersPage(props: { searchParams: Promise<{ filter?: string }> }) {
  const searchParams = await props.searchParams;
  const filter = searchParams.filter || 'all';
  const supabase = getServiceSupabase();

  // Fetch only pending reminders with joined users
  let query = supabase
    .from('reminders')
    .select('*, users(name, phone)')
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true });

  // Apply date filters
  const now = new Date();
  if (filter === 'today') {
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    query = query.gte('scheduled_at', startOfDay).lte('scheduled_at', endOfDay);
  } else if (filter === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    query = query.gte('scheduled_at', startOfWeek.toISOString()).lte('scheduled_at', endOfWeek.toISOString());
  }

  let remindersData: any[] = [];
  try {
    const { data } = await query;
    if (data) remindersData = data;
  } catch (e) {
    // Fallback if table doesn't exist
  }
  const reminders = remindersData;

  // Get total pending count for the badge (ignoring the filter)
  let totalPendingCount = 0;
  try {
    const { count } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (count) totalPendingCount = count;
  } catch (e) {}

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">Lembretes Ativos</h2>
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20 px-2 py-0.5">
          {totalPendingCount || 0} pendentes
        </Badge>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit">
        <Link href="?filter=all" className="flex items-center justify-center">
          <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" type="button">Todos</Button>
        </Link>
        <Link href="?filter=today" className="flex items-center justify-center">
          <Button variant={filter === 'today' ? 'default' : 'ghost'} size="sm" type="button">Hoje</Button>
        </Link>
        <Link href="?filter=week" className="flex items-center justify-center">
          <Button variant={filter === 'week' ? 'default' : 'ghost'} size="sm" type="button">Esta semana</Button>
        </Link>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Usuário</TableHead>
                <TableHead>Lembrete</TableHead>
                <TableHead>Agendado para</TableHead>
                <TableHead>Recorrência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum lembrete pendente encontrado para este período.
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map((reminder: any) => {
                  const userName = reminder.users?.name || 'Desconhecido';
                  const userPhone = reminder.users?.phone || '';
                  const initials = userName.substring(0, 2).toUpperCase();
                  const content = reminder.content || '';
                  const isTruncated = content.length > 60;
                  const displayContent = isTruncated ? content.substring(0, 60) + '...' : content;

                  return (
                    <TableRow key={reminder.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{userName}</span>
                            <span className="text-xs text-muted-foreground">{userPhone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {isTruncated ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-left cursor-default">
                                {displayContent}
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px] whitespace-pre-wrap">
                                {content}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          displayContent
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatReminderDate(reminder.scheduled_at)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {reminder.recurrence === 'daily' ? 'Diário' : reminder.recurrence === 'weekly' ? 'Semanal' : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          reminder.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20' :
                          reminder.status === 'sent' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20' :
                          'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20'
                        }>
                          {reminder.status === 'pending' ? 'Pendente' : reminder.status === 'sent' ? 'Enviado' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <CancelButton id={reminder.id} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}