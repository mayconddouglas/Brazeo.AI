"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "./actions";

import { Bot } from "lucide-react";

export function SettingsForm({ initialData }: { initialData: any }) {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget);

    const res = await saveSettingsAction(formData);
    
    setIsPending(false);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Configurações do Agente salvas com sucesso!");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-6 text-primary" />
          Perfil da Safira
        </CardTitle>
        <CardDescription>Configure como a inteligência artificial se apresenta e conversa com seus clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent_name">Nome do Agente</Label>
              <Input 
                id="agent_name" 
                name="agent_name"
                defaultValue={initialData?.agent_name || "Brazeo.IA"}
                required
                placeholder="Ex: Carlos do Suporte"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tom de Resposta</Label>
              <Select name="agent_tone" defaultValue={initialData?.agent_tone || "friendly"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Amigável e Prestativo</SelectItem>
                  <SelectItem value="formal">Sério e Formal</SelectItem>
                  <SelectItem value="fun">Divertido (com Emojis)</SelectItem>
                  <SelectItem value="sales">Focado em Vendas / Persuasivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col h-full space-y-2">
            <Label htmlFor="agent_instructions">Instruções Adicionais (Regras do Bot)</Label>
            <Textarea 
              id="agent_instructions" 
              name="agent_instructions"
              defaultValue={initialData?.agent_instructions || ""}
              placeholder="Ex: Nunca ofereça descontos maiores que 10%. Sempre finalize a conversa perguntando se pode ajudar em mais alguma coisa."
              className="flex-grow min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O modelo de inteligência artificial seguirá essas regras fielmente em cada nova mensagem.
            </p>
          </div>
          
          <div className="md:col-span-2 flex justify-end pt-4 border-t">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Alterações do Perfil"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}