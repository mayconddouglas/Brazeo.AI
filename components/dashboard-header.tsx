"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const hydrate = async () => {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("role", "user")
        .is("read_at", null);

      setUnreadTotal(count ?? 0);
    };

    hydrate();

    const channel = supabase
      .channel("unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg: any = payload.new;
          if (msg?.role !== "user") return;
          if (msg?.read_at) return;
          setUnreadTotal((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const next: any = payload.new;
          const prev: any = payload.old;
          if (next?.role !== "user") return;
          if (next?.read_at != null && (!prev || prev?.read_at == null)) {
            setUnreadTotal((v) => Math.max(0, v - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        
        <div className="relative inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted cursor-pointer transition-colors">
          <Bell className="size-5 text-muted-foreground" />
          {unreadTotal > 0 && (
            <span className="absolute top-1 right-1 flex min-w-3.5 h-3.5 px-0.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-background">
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 border-l pl-4 ml-1">
          <Badge variant="outline" className="text-green-600 border-green-600 text-xs hidden sm:inline-flex">Beta</Badge>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
