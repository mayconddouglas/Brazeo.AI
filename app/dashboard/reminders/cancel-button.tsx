"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTransition } from "react";
import { cancelReminderAction } from "./actions";
import { toast } from "sonner";

export function CancelButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="icon"
      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const res = await cancelReminderAction(id);
          if (res?.error) {
            toast.error("Erro ao cancelar: " + res.error);
          } else {
            toast.success("Lembrete cancelado!");
          }
        });
      }}
      title="Cancelar Lembrete"
    >
      <X className="h-4 w-4" />
    </Button>
  );
}