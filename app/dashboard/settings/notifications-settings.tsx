"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { saveNotificationsAction } from "./actions";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function NotificationsSettings({ settings }: { settings: any }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await saveNotificationsAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Configurações de notificações atualizadas!");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações e Rotinas</CardTitle>
        <CardDescription>Configure os horários e intervalos dos disparos automáticos do sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="planner_time">Horário do Planejador Semanal</Label>
              <Input 
                type="time" 
                id="planner_time" 
                name="planner_time" 
                defaultValue={settings?.planner_time || "08:00"}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">Horário que o agente enviará as tarefas (toda segunda-feira).</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="morning_time">Horário do Bom Dia</Label>
              <Input 
                type="time" 
                id="morning_time" 
                name="morning_time" 
                defaultValue={settings?.morning_time || "08:00"}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">Horário do disparo diário de bom dia.</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="summary_time">Horário do Resumo Semanal</Label>
              <Input 
                type="time" 
                id="summary_time" 
                name="summary_time" 
                defaultValue={settings?.summary_time || "18:00"}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">Horário do fechamento da semana (toda sexta-feira).</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback_interval">Intervalo do Feedback</Label>
              <Select name="feedback_interval" defaultValue={settings?.feedback_interval?.toString() || "3"} disabled={isPending}>
                <SelectTrigger id="feedback_interval">
                  <SelectValue placeholder="Selecione os dias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">A cada 3 dias</SelectItem>
                  <SelectItem value="5">A cada 5 dias</SelectItem>
                  <SelectItem value="7">A cada 7 dias</SelectItem>
                  <SelectItem value="14">A cada 14 dias</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">De quantos em quantos dias pedir avaliação de satisfação.</p>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Notificações"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}