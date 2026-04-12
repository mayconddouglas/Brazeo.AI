"use client";

import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Server, MessageSquare, Database, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SystemStatusData = {
  supabase: "online" | "error";
  openrouter: "configured" | "pending";
  tavily: "configured" | "pending";
  evolution: "connected" | "disconnected";
};

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/system-status");
      const data = await res.json();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Erro ao buscar status:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Optional: auto-refresh every minute
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const getErrorCount = () => {
    if (!status) return 0;
    let count = 0;
    if (status.supabase === "error") count++;
    if (status.openrouter === "pending") count++;
    if (status.tavily === "pending") count++;
    if (status.evolution === "disconnected") count++;
    return count;
  };

  const errorCount = getErrorCount();

  const getBadgeVariant = (state: string) => {
    if (state === "online" || state === "configured" || state === "connected") {
      return "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20";
    }
    if (state === "pending") {
      return "bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20 dark:text-gray-400";
    }
    return "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20";
  };

  const getLabel = (state: string) => {
    switch (state) {
      case "online": return "Online";
      case "error": return "Erro";
      case "configured": return "Configurado";
      case "pending": return "Pendente";
      case "connected": return "Conectado";
      case "disconnected": return "Desconectado";
      default: return state;
    }
  };

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted cursor-pointer transition-colors outline-none border-none">
        <Bell className="size-5 text-muted-foreground" />
        {errorCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-background">
            {errorCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <h4 className="font-semibold leading-none">Status do Sistema</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {lastUpdated ? `Atualizado agora` : "Carregando..."}
          </p>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <MessageSquare className="size-4 text-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">Evolution API</span>
                <span className="text-xs text-muted-foreground mt-1">WhatsApp</span>
              </div>
            </div>
            <Badge variant="secondary" className={cn("px-2 py-0.5", status && getBadgeVariant(status.evolution))}>
              {status ? getLabel(status.evolution) : "..."}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <Server className="size-4 text-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">OpenRouter</span>
                <span className="text-xs text-muted-foreground mt-1">Modelos de IA</span>
              </div>
            </div>
            <Badge variant="secondary" className={cn("px-2 py-0.5", status && getBadgeVariant(status.openrouter))}>
              {status ? getLabel(status.openrouter) : "..."}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <Database className="size-4 text-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">Supabase</span>
                <span className="text-xs text-muted-foreground mt-1">Banco de Dados</span>
              </div>
            </div>
            <Badge variant="secondary" className={cn("px-2 py-0.5", status && getBadgeVariant(status.supabase))}>
              {status ? getLabel(status.supabase) : "..."}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <Globe className="size-4 text-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">Tavily</span>
                <span className="text-xs text-muted-foreground mt-1">Pesquisa Web</span>
              </div>
            </div>
            <Badge variant="secondary" className={cn("px-2 py-0.5", status && getBadgeVariant(status.tavily))}>
              {status ? getLabel(status.tavily) : "..."}
            </Badge>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={fetchStatus} 
            disabled={isLoading}
          >
            <RefreshCw className={cn("mr-2 size-3", isLoading && "animate-spin")} />
            Atualizar status
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}