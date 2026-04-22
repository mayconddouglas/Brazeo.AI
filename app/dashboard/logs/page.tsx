"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AgentLogRow = {
  id: string;
  type: string;
  message: string;
  context: any;
  created_at: string;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AgentLogRow[]>([]);
  const [filter, setFilter] = useState<"all" | "error" | "warning">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  const isConfigured = !!supabase;

  const loadLogs = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      let q = supabase
        .from("agent_logs")
        .select("id,type,message,context,created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter !== "all") q = q.eq("type", filter);

      const { data } = await q;
      setLogs((data as any[]) || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const t = setInterval(loadLogs, 30000);
    return () => clearInterval(t);
  }, [filter, isConfigured]);

  const handleClearOld = async () => {
    if (!supabase) return;
    setIsClearing(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      await supabase.from("agent_logs").delete().lt("created_at", cutoff.toISOString());
      await loadLogs();
    } finally {
      setIsClearing(false);
    }
  };

  const badgeClass = (t: string) => {
    if (t === "error") return "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20";
    if (t === "warning") return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20";
    return "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20";
  };

  const summarizeContext = (ctx: any) => {
    try {
      const s = typeof ctx === "string" ? ctx : JSON.stringify(ctx);
      return s.length > 120 ? `${s.slice(0, 120)}…` : s;
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Logs do Sistema</h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="error">Erros</SelectItem>
              <SelectItem value="warning">Avisos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleClearOld} disabled={!isConfigured || isClearing}>
            {isClearing ? "Limpando..." : "Limpar logs antigos"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Últimos 50 registros</CardTitle>
          <div className="text-xs text-muted-foreground">{isLoading ? "Atualizando..." : "Auto-refresh: 30s"}</div>
        </CardHeader>
        <CardContent>
          {!isConfigured && (
            <div className="text-sm text-muted-foreground">
              Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para visualizar logs.
            </div>
          )}

          {isConfigured && (
            <div className="rounded-md border">
              <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Mensagem</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contexto</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle">
                          <Badge variant="secondary" className={badgeClass(log.type)}>
                            {log.type}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle max-w-[420px]">
                          <div className="line-clamp-2">{log.message}</div>
                        </td>
                        <td className="p-4 align-middle max-w-[420px] font-mono text-xs text-muted-foreground">
                          {summarizeContext(log.context)}
                        </td>
                        <td className="p-4 align-middle text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                          Nenhum log encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
