"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createBroadcastAction } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";

export function BroadcastForm({ activeUsers }: { activeUsers: any[] }) {
  const [target, setTarget] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    if (selectedUsers.length === activeUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(activeUsers.map(u => u.id));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("target", target); // Since shadcn select doesn't use native name by default without hidden input

    if (target === "specific" && selectedUsers.length === 0) {
      toast.error("Selecione pelo menos um usuário.");
      return;
    }

    startTransition(async () => {
      const res = await createBroadcastAction(formData, selectedUsers);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.isImmediate ? "Disparo iniciado com sucesso!" : "Agendamento salvo com sucesso!");
        // Reset form except target
        const form = e.target as HTMLFormElement;
        form.reset();
        setSelectedUsers([]);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Mensagem</CardTitle>
        <CardDescription>Envie uma mensagem para múltiplos usuários.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Público Alvo</Label>
            <Select value={target} onValueChange={(val) => setTarget(val || "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o público" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários Ativos ({activeUsers.length})</SelectItem>
                <SelectItem value="specific">Usuários Específicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target === "specific" && (
            <div className="flex flex-col gap-2 border rounded-md p-3 bg-muted/20">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="text-sm font-medium">Selecione os contatos</Label>
                <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                  {selectedUsers.length === activeUsers.length ? "Desmarcar Todos" : "Marcar Todos"}
                </Button>
              </div>
              <ScrollArea className="h-[150px] w-full rounded-md mt-2">
                <div className="flex flex-col gap-3 p-1">
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`user-${user.id}`} 
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {user.name || 'Sem nome'} <span className="text-muted-foreground font-normal">({user.phone})</span>
                      </label>
                    </div>
                  ))}
                  {activeUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">Nenhum usuário ativo encontrado.</p>
                  )}
                </div>
              </ScrollArea>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedUsers.length} usuário(s) selecionado(s).
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea 
              name="message"
              id="message" 
              required
              className="min-h-[120px]"
              placeholder="Digite sua mensagem aqui..."
            />
            <p className="text-[11px] text-muted-foreground">
              Dica: Use <strong className="font-mono text-foreground">{`{nome}`}</strong> para enviar mensagens personalizadas. O sistema trocará pelo primeiro nome do cliente.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="schedule">Agendamento (Opcional)</Label>
            <Input 
              type="datetime-local" 
              name="schedule"
              id="schedule" 
            />
            <p className="text-[11px] text-muted-foreground">
              Se deixar em branco, o envio será imediato.
            </p>
          </div>
          
          <Button type="submit" className="mt-2" disabled={isPending}>
            {isPending ? "Processando..." : "Salvar / Enviar Broadcast"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}