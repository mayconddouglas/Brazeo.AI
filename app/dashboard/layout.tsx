"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { DashboardHeader } from "@/components/dashboard-header";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname.includes('/conversations');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex w-full flex-col h-screen overflow-hidden">
          <DashboardHeader />
          <main className={cn(
            "flex-1 overflow-auto",
            isChatPage ? "p-0 sm:p-0 md:p-0 overflow-hidden flex flex-col" : "p-4 sm:p-6 md:p-8"
          )}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
