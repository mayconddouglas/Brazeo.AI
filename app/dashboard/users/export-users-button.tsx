"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useTransition } from "react";
import { exportUsersCSVAction } from "./actions";
import { toast } from "sonner";

export function ExportUsersButton() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportUsersCSVAction();
      if (res.error || !res.csv) {
        toast.error(res.error || "Erro ao exportar");
        return;
      }

      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `usuarios_safira_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Exportação concluída!");
    });
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isPending}
    >
      <Download className="mr-2 h-4 w-4" />
      {isPending ? "Exportando..." : "Exportar CSV"}
    </Button>
  );
}