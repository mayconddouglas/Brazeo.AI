"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MissionRow = {
  id: string;
  titulo: string;
  objetivo: string;
  prazo_dias: number;
  tarefas_diarias?: string | null;
  progresso?: number | null;
  status?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
  users?: { name?: string | null } | null;
};

type HabitRow = {
  id: string;
  user_id: string;
  nome: string;
  frequencia: string;
  horario_lembrete?: string | null;
  streak?: number | null;
  last_check_in?: string | null;
  status?: string | null;
  users?: { name?: string | null } | null;
};

function initialsFromName(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : (parts[0]?.[1] ?? "");
  return (first + second).toUpperCase();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dateOnlyUtc(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function computeMissionProgress(m: MissionRow) {
  const prazo = Number(m.prazo_dias) || 30;
  const start = m.starts_at || m.created_at;
  const startAt = start ? new Date(start) : new Date();
  const now = new Date();
  const diffDays = Math.floor((dateOnlyUtc(now) - dateOnlyUtc(startAt)) / (1000 * 60 * 60 * 24));
  const daysPassed = clamp(diffDays + 1, 0, prazo);
  const percent = prazo > 0 ? Math.round((daysPassed / prazo) * 100) : 0;

  const endsAt = m.ends_at
    ? new Date(m.ends_at)
    : (() => {
        const d = new Date(startAt);
        d.setDate(d.getDate() + prazo);
        return d;
      })();

  return { prazo, daysPassed, percent, startAt, endsAt };
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissionRow | null>(null);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  const isConfigured = !!supabase;

  const loadData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const [{ data: missionsData }, { data: habitsData }] = await Promise.all([
        supabase
          .from("missions")
          .select("id,titulo,objetivo,prazo_dias,tarefas_diarias,progresso,status,starts_at,ends_at,created_at,users(name)")
          .eq("status", "active")
          .order("created_at", { ascending: false }),
        supabase
          .from("habits")
          .select("id,user_id,nome,frequencia,horario_lembrete,streak,last_check_in,status,users(name)")
          .eq("status", "active")
          .order("streak", { ascending: false })
          .limit(200),
      ]);

      setMissions((missionsData as any[]) || []);
      setHabits((habitsData as any[]) || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isConfigured]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Missões e Hábitos</h2>
          <p className="text-muted-foreground">Acompanhe missões ativas e hábitos com streak.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={!isConfigured || isLoading}>
          {isLoading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {!isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supabase não configurado</CardTitle>
            <CardDescription>
              Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para visualizar missões e hábitos.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isConfigured && (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Missões Ativas</h3>
              <span className="text-xs text-muted-foreground">{missions.length} missão(ões)</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {missions.map((m) => {
                const { prazo, daysPassed, percent, endsAt } = computeMissionProgress(m);
                const badgeLabel = prazo === 60 ? "60 dias" : prazo === 90 ? "90 dias" : "30 dias";
                const userName = m.users?.name || "Sem nome";
                const endsLabel = endsAt.toLocaleDateString("pt-BR");

                return (
                  <Card key={m.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{m.titulo}</CardTitle>
                          <CardDescription className="line-clamp-2">{m.objetivo}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {badgeLabel}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {daysPassed}/{prazo} dias
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <Progress value={percent} />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {initialsFromName(userName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{userName}</span>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">Termina: {endsLabel}</div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setSelectedMission(m)}
                        className="w-full"
                      >
                        Ver detalhes
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}

              {missions.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base">Nenhuma missão ativa</CardTitle>
                    <CardDescription>Quando houver missões ativas, elas aparecerão aqui.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Hábitos com Streak</h3>
              <span className="text-xs text-muted-foreground">{habits.length} hábito(s)</span>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Hábito</TableHead>
                      <TableHead>Streak</TableHead>
                      <TableHead>Última confirmação</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {habits.map((h) => {
                      const userName = h.users?.name || "Sem nome";
                      const last = h.last_check_in ? new Date(h.last_check_in).toLocaleString("pt-BR") : "Nunca";
                      const streak = typeof h.streak === "number" ? h.streak : 0;
                      const freq = h.frequencia === "weekly" ? "Semanal" : "Diário";
                      const status = h.status || "active";

                      return (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {initialsFromName(userName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{userName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{h.nome}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1">
                              {streak} <span>🔥</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{last}</TableCell>
                          <TableCell>{freq}</TableCell>
                          <TableCell>
                            <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {habits.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum hábito ativo encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Sheet open={!!selectedMission} onOpenChange={(open) => !open && setSelectedMission(null)}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              {selectedMission && (
                <>
                  <SheetHeader className="mb-4">
                    <SheetTitle>{selectedMission.titulo}</SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Resumo</CardTitle>
                        <CardDescription>{selectedMission.objetivo}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        {(() => {
                          const { prazo, daysPassed, percent, startAt, endsAt } = computeMissionProgress(selectedMission);
                          const userName = selectedMission.users?.name || "Sem nome";
                          return (
                            <>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {daysPassed}/{prazo} dias
                                </span>
                                <span>{percent}%</span>
                              </div>
                              <Progress value={percent} />
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Usuário</span>
                                <span className="font-medium">{userName}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Início</span>
                                <span className="font-medium">{startAt.toLocaleDateString("pt-BR")}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Término</span>
                                <span className="font-medium">{endsAt.toLocaleDateString("pt-BR")}</span>
                              </div>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Histórico</CardTitle>
                        <CardDescription>Progresso recente estimado pela duração.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        {(() => {
                          const { prazo, daysPassed } = computeMissionProgress(selectedMission);
                          const start = Math.max(1, daysPassed - 6);
                          const end = Math.max(1, daysPassed);
                          const items = [];
                          for (let d = start; d <= end; d++) {
                            const pct = Math.round((d / prazo) * 100);
                            items.push(
                              <div key={d} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Dia {d}</span>
                                <span className="font-medium">{pct}%</span>
                              </div>
                            );
                          }
                          return items;
                        })()}

                        {selectedMission.tarefas_diarias && (
                          <div className="pt-3 text-sm">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                              Tarefa diária
                            </div>
                            <div className="whitespace-pre-wrap">{selectedMission.tarefas_diarias}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}

