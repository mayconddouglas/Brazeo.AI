"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { startNewConversation } from "./actions";

export function NewConversationDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStartConversation = () => {
    setError("");
    
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    startTransition(async () => {
      const res = await startNewConversation(name.trim(), phone.trim(), message.trim());
      
      if (res.error) {
        setError(res.error);
      } else if (res.success && res.userId) {
        setOpen(false);
        // Limpar form
        setName("");
        setPhone("");
        setMessage("");
        // Forçar atualização para o novo contato aparecer na lista e selecionar ele
        router.refresh();
        router.push(`/dashboard/conversations?userId=${res.userId}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="outline" className="h-8 w-8 rounded-full shadow-sm"><MessageSquarePlus className="h-4 w-4 text-primary" /></Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
          <DialogDescription>
            Inicie um atendimento com um novo contato. A mensagem será enviada imediatamente para o WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Contato</Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="phone">WhatsApp (com código do país)</Label>
            <Input
              id="phone"
              placeholder="Ex: 5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              disabled={isPending}
            />
            <span className="text-[10px] text-muted-foreground">Somente números. Exemplo: 55 para Brasil, seguido do DDD e número.</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Primeira Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Olá, como posso ajudar?"
              className="resize-none h-24"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleStartConversation} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Conversa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}