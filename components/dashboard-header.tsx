"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { SystemStatus } from "@/components/system-status";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const getPageTitle = (pathname: string) => {
  if (pathname === "/dashboard") return "Visão Geral";
  if (pathname.includes("/dashboard/users")) return "Usuários";
  if (pathname.includes("/dashboard/conversations")) return "Conversas";
  if (pathname.includes("/dashboard/broadcast")) return "Disparos";
  if (pathname.includes("/dashboard/knowledge")) return "Base de Conhecimento";
  if (pathname.includes("/dashboard/settings")) return "Configurações";
  if (pathname.includes("/dashboard/test")) return "Testar Agente";
  if (pathname.includes("/dashboard/analytics")) return "Analytics";
  return "Dashboard";
};

const formatDateTime = (date: Date) => {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const monthName = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dayName}, ${day} ${monthName} · ${hours}:${minutes}`;
};

export function DashboardHeader() {
  const pathname = usePathname();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-xl font-semibold ml-2">{getPageTitle(pathname)}</h1>
      </div>
      <div className="flex items-center gap-4">
        {time && (
          <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
            {formatDateTime(time)}
          </span>
        )}
        
        <SystemStatus />

        <div className="flex items-center gap-2 border-l pl-4 ml-1">
          <Badge variant="outline" className="text-green-600 border-green-600 text-xs hidden sm:inline-flex">Beta</Badge>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}