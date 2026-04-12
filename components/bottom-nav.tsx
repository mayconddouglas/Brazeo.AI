"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, MessageSquare, Users, Send, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Visão Geral", href: "/dashboard", icon: BarChart3 },
  { name: "Conversas", href: "/dashboard/conversations", icon: MessageSquare },
  { name: "Usuários", href: "/dashboard/users", icon: Users },
  { name: "Disparos", href: "/dashboard/broadcast", icon: Send },
  { name: "Config", href: "/dashboard/settings", icon: Settings2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background flex items-center justify-around px-2 md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 rounded-lg transition-colors my-1 py-1",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium leading-none">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}