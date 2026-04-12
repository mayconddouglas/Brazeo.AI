"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveBehaviorSettingsAction } from "./actions";
import { useTransition } from "react";

export function BehaviorSettings({ settings }: { settings: any }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (field: string, checked: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append(field, checked.toString());
      
      const res = await saveBehaviorSettingsAction(formData);
      
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Configuração atualizada!");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Limites e Comportamento</CardTitle>
        <CardDescription>Ative ou desative recursos automáticos do agente e fluxos de engajamento.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="planner_active" className="text-base">Planejador Semanal</Label>
            <span className="text-sm text-muted-foreground">O agente organizará as tarefas pendentes da semana.</span>
          </div>
          <Switch 
            id="planner_active" 
            disabled={isPending}
            checked={settings?.planner_active !== false} 
            onCheckedChange={(c) => handleToggle("planner_active", c)} 
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="morning_message_active" className="text-base">Mensagem de Bom Dia Automática</Label>
            <span className="text-sm text-muted-foreground">Envia um resumo da agenda diária às 08h00 da manhã.</span>
          </div>
          <Switch 
            id="morning_message_active" 
            disabled={isPending}
            checked={settings?.morning_message_active !== false} 
            onCheckedChange={(c) => handleToggle("morning_message_active", c)} 
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="internet_search_active" className="text-base">Pesquisa na Internet</Label>
            <span className="text-sm text-muted-foreground">Permite que o agente acesse a internet para buscar respostas (Requer Tavily).</span>
          </div>
          <Switch 
            id="internet_search_active" 
            disabled={isPending}
            checked={settings?.internet_search_active !== false} 
            onCheckedChange={(c) => handleToggle("internet_search_active", c)} 
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="feedback_active" className="text-base">Feedback Periódico</Label>
            <span className="text-sm text-muted-foreground">Pede nota de satisfação aos usuários a cada 3 dias.</span>
          </div>
          <Switch 
            id="feedback_active" 
            disabled={isPending}
            checked={settings?.feedback_active !== false} 
            onCheckedChange={(c) => handleToggle("feedback_active", c)} 
          />
        </div>
      </CardContent>
    </Card>
  );
}