"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { saveEvolutionKeysAction, saveOpenRouterKeyAction } from "./actions";

export function EvolutionModal({ initialData, siteUrl }: { initialData: any, siteUrl: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    formData.append("siteUrl", siteUrl);
    const res = await saveEvolutionKeysAction(formData);
    setIsPending(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Integração salva e Webhook configurado!");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Configurar</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Evolution API (WhatsApp)</DialogTitle>
            <DialogDescription>
              Insira as credenciais da sua instância da Evolution API. Nós testaremos a conexão e configuraremos automaticamente o Webhook para você.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="evolution_api_url">URL da API</Label>
              <Input 
                id="evolution_api_url" 
                name="evolution_api_url" 
                placeholder="https://api.evolution.com"
                defaultValue={initialData?.evolution_api_url || ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="evolution_api_key">Global API Key</Label>
              <Input 
                id="evolution_api_key" 
                name="evolution_api_key" 
                type="password"
                placeholder="********"
                defaultValue={initialData?.evolution_api_key || ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="evolution_instance_name">Nome da Instância</Label>
              <Input 
                id="evolution_instance_name" 
                name="evolution_instance_name" 
                placeholder="brazeo-instance"
                defaultValue={initialData?.evolution_instance_name || ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar Chaves"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function OpenRouterModal({ initialData }: { initialData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    const res = await saveOpenRouterKeyAction(formData);
    setIsPending(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Integração OpenRouter salva!");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Configurar</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>APIs de Inteligência Artificial</DialogTitle>
            <DialogDescription>
              Configure o OpenRouter para gerar os textos do agente (cérebro) e a chave da OpenAI/Groq para processar mensagens de áudio (Whisper).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="openrouter_api_key">OpenRouter API Key (Textos)</Label>
              <Input 
                id="openrouter_api_key" 
                name="openrouter_api_key" 
                type="password"
                placeholder="sk-or-v1-..."
                defaultValue={initialData?.openrouter_api_key || ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="openai_api_key">Groq / OpenAI API Key (Áudios)</Label>
              <Input 
                id="openai_api_key" 
                name="openai_api_key" 
                type="password"
                placeholder="gsk_... ou sk-..."
                defaultValue={initialData?.openai_api_key || ""}
              />
              <p className="text-xs text-muted-foreground mt-1">Apenas para transcrição de áudio via Whisper.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar Chaves"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}