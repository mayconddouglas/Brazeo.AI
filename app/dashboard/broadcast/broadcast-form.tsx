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
import { SearchIcon, Loader2, CalendarIcon, SendIcon, ClockIcon } from "lucide-react";

export function BroadcastForm({ activeUsers }: { activeUsers: any[] }) {
  const [target, setTarget] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const filteredUsers = activeUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.phone?.includes(searchQuery)
  );

  const selectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
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
        setMessageText("");
        setScheduleDate("");
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
              <SelectTrigger className="h-12 text-base md:text-sm w-full md:w-[300px]">
                <SelectValue placeholder="Selecione o público" />
              </SelectTrigger>
              <SelectContent className="w-full md:w-[300px]">
                <SelectItem value="all" className="text-base md:text-sm py-3">Todos os Usuários Ativos ({activeUsers.length})</SelectItem>
                <SelectItem value="specific" className="text-base md:text-sm py-3">Usuários Específicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target === "specific" && (
            <div className="flex flex-col gap-2 border rounded-md p-3 bg-muted/20">
              <div className="flex flex-col gap-2 border-b pb-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Selecione os contatos</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                    {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? "Desmarcar Todos" : "Marcar Visíveis"}
                  </Button>
                </div>
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por nome ou telefone..." 
                    className="pl-9 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="h-[200px] w-full rounded-md mt-2">
                <div className="flex flex-col gap-3 p-1">
                  {filteredUsers.map((user) => (
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
                  {filteredUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum contato encontrado.</p>
                  )}
                </div>
              </ScrollArea>
              <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                <span>{selectedUsers.length} selecionado(s)</span>
                <span>{filteredUsers.length} listado(s)</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message">Mensagem</Label>
                <span className="text-[10px] text-muted-foreground">{messageText.length} caracteres</span>
              </div>
              <Textarea 
                name="message"
                id="message" 
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="min-h-[120px] resize-y"
                placeholder="Digite sua mensagem aqui..."
              />
              <p className="text-[11px] text-muted-foreground">
                Dica: Use <strong className="font-mono text-foreground">{`{nome}`}</strong> para personalizar.
              </p>
            </div>
            
            {messageText && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Pré-visualização</Label>
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg rounded-tl-none border border-emerald-200 dark:border-emerald-800/50 w-full md:w-[85%] relative">
                  <p className="text-sm whitespace-pre-wrap text-emerald-950 dark:text-emerald-100">
                    {messageText.replace(/\{nome\}/gi, "João")}
                  </p>
                  <div className="text-[9px] text-emerald-700/60 dark:text-emerald-400/50 text-right mt-1">
                    Agora
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="schedule">Agendamento (Opcional)</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="datetime-local" 
                name="schedule"
                id="schedule" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Se deixar em branco, o envio será imediato.
            </p>
          </div>
          
          <Button type="submit" className="mt-2 w-full" disabled={isPending || (target === 'specific' && selectedUsers.length === 0)}>
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
            ) : scheduleDate ? (
              <><ClockIcon className="mr-2 h-4 w-4" /> Agendar Disparo</>
            ) : (
              <><SendIcon className="mr-2 h-4 w-4" /> Enviar Agora</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}