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

export function EvolutionModal({ initialData }: { initialData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    const res = await saveEvolutionKeysAction(formData);
    setIsPending(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Integração Evolution API salva!");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Configurar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Evolution API (WhatsApp)</DialogTitle>
            <DialogDescription>
              Insira as credenciais da sua instância da Evolution API. O sistema priorizará essas chaves em relação às variáveis da Vercel.
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
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Configurar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>OpenRouter API (IA)</DialogTitle>
            <DialogDescription>
              Insira a sua chave do OpenRouter para ativar a inteligência do agente. O sistema priorizará essa chave em relação à da Vercel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="openrouter_api_key">API Key</Label>
              <Input 
                id="openrouter_api_key" 
                name="openrouter_api_key" 
                type="password"
                placeholder="sk-or-v1-..."
                defaultValue={initialData?.openrouter_api_key || ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar Chave"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}