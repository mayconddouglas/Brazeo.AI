"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTransition } from "react";
import { exportConversationAction } from "./actions";
import { toast } from "sonner";

export function ExportConversationButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  if (!userId) return null;

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportConversationAction(userId);
      if (res.error || !res.txt) {
        toast.error(res.error || "Erro ao exportar conversa");
        return;
      }

      const safeName = (res.userName || "usuario").toLowerCase().replace(/[^a-z0-9]/g, "_");
      
      const blob = new Blob([res.txt], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `conversa_${safeName}_${new Date().toISOString().slice(0, 10)}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Histórico exportado!");
    });
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleExport} 
      disabled={isPending}
      className="hidden md:flex"
    >
      <Download className="mr-2 h-4 w-4" />
      {isPending ? "Exportando..." : "Exportar conversa"}
    </Button>
  );
}