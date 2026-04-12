"use client"

import * as React from "react"
import {
  MessageSquare,
  Users,
  Settings2,
  Send,
  BarChart3,
  Bot,
  LogOut,
  GalleryVerticalEnd,
  FlaskConical,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { logout } from "@/app/login/actions"
import { useTransition } from "react"
import { cn } from "@/lib/utils"

const data = {
  user: {
    name: "Admin",
    email: "admin@brazeo.ia",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Visão Geral",
      url: "/dashboard",
      icon: BarChart3,
    },
  ],
  navEngage: [
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: TrendingUp,
    },
    {
      title: "Conversas",
      url: "/dashboard/conversations",
      icon: MessageSquare,
    },
    {
      title: "Usuários",
      url: "/dashboard/users",
      icon: Users,
    },
    {
      title: "Disparos",
      url: "/dashboard/broadcast",
      icon: Send,
    },
  ],
  navSettings: [
    {
      title: "Base de Conhecimento",
      url: "/dashboard/knowledge",
      icon: GalleryVerticalEnd,
    },
    {
      title: "Testar Agente",
      url: "/dashboard/test",
      icon: FlaskConical,
    },
    {
      title: "Configurações",
      url: "/dashboard/settings",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className={cn("flex flex-col gap-0.5 leading-none transition-all duration-200", isCollapsed && "hidden")}>
                  <span className="font-semibold">
                    <span className="animate-pulse bg-green-500 rounded-full w-2 h-2 inline-block mr-1"></span>
                    Safira
                  </span>
                  <span className="text-xs text-muted-foreground">by Brazeo.AI</span>
                </div>
              </Link>
            } />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Painel Section */}
        <SidebarMenu className={cn("px-2 pt-4 pb-2", isCollapsed && "px-0 pt-2 pb-2")}>
          <div className={cn(
            "mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-200",
            isCollapsed && "hidden"
          )}>
            Painel
          </div>
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={pathname === item.url} tooltip={item.title} render={
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              } />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator className={cn(isCollapsed && "my-1")} />

        {/* Engajamento Section */}
        <SidebarMenu className={cn("px-2 py-2", isCollapsed && "px-0 py-2")}>
          <div className={cn(
            "mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-200",
            isCollapsed && "hidden"
          )}>
            Engajamento
          </div>
          {data.navEngage.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={pathname === item.url} tooltip={item.title} render={
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              } />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator className={cn(isCollapsed && "my-1")} />

        {/* Sistema Section */}
        <SidebarMenu className={cn("px-2 py-2", isCollapsed && "px-0 py-2")}>
          <div className={cn(
            "mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-200",
            isCollapsed && "hidden"
          )}>
            Sistema
          </div>
          {data.navSettings.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={pathname === item.url} tooltip={item.title} render={
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              } />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} disabled={isPending} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
              <LogOut className="size-4" />
              <span className={cn("transition-all duration-200", isCollapsed && "hidden")}>{isPending ? "Saindo..." : "Sair"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
