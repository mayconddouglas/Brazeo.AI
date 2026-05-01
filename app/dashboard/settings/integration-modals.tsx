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

export function EvolutionModal({ initialData, siteUrl, onSaved }: { initialData: any, siteUrl: string, onSaved: (patch: any) => void }) {
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
      onSaved({
        evolution_api_url: (formData.get("evolution_api_url") as string) || null,
        evolution_api_key: (formData.get("evolution_api_key") as string) || null,
        evolution_instance_name: (formData.get("evolution_instance_name") as string) || null,
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Configurar</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>WhatsApp — Evolution API</DialogTitle>
            <DialogDescription>
              Configure a conexão com a Evolution API para o agente enviar e receber mensagens pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="evolution_api_url">Evolution API URL</Label>
              <Input 
                id="evolution_api_url" 
                name="evolution_api_url" 
                placeholder="https://sua-api.com"
                defaultValue={initialData?.evolution_api_url || ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="evolution_api_key">Evolution API Key</Label>
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
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar configuração do WhatsApp"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function OpenRouterModal({ initialData, onSaved }: { initialData: any, onSaved: (patch: any) => void }) {
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
      onSaved({
        openrouter_api_key: (formData.get("openrouter_api_key") as string) || null,
        openai_api_key: initialData?.openai_api_key || null,
        groq_api_key: initialData?.groq_api_key || null,
        tavily_api_key: initialData?.tavily_api_key || null,
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Configurar</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modelo de IA — OpenRouter</DialogTitle>
            <DialogDescription>
              O OpenRouter é o cérebro principal da Safira. Insira sua chave para ativar as respostas inteligentes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="openrouter_api_key">OpenRouter API Key</Label>
              <Input 
                id="openrouter_api_key" 
                name="openrouter_api_key" 
                type="password"
                placeholder="sk-or-v1-..."
                defaultValue={initialData?.openrouter_api_key || ""}
              />
              <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground underline underline-offset-4 w-fit">
                Obter chave em openrouter.ai
              </a>
            </div>
            <input type="hidden" name="openai_api_key" defaultValue={initialData?.openai_api_key || ""} />
            <input type="hidden" name="groq_api_key" defaultValue={initialData?.groq_api_key || ""} />
            <input type="hidden" name="tavily_api_key" defaultValue={initialData?.tavily_api_key || ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar chave do OpenRouter"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function OpenAIModal({ initialData, onSaved }: { initialData: any, onSaved: (patch: any) => void }) {
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
      toast.success("Chave OpenAI salva!");
      onSaved({
        openrouter_api_key: initialData?.openrouter_api_key || null,
        openai_api_key: (formData.get("openai_api_key") as string) || null,
        groq_api_key: initialData?.groq_api_key || null,
        tavily_api_key: initialData?.tavily_api_key || null,
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Configurar</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Base de Conhecimento — OpenAI</DialogTitle>
            <DialogDescription>
              Necessário para converter PDFs e textos na Base de Conhecimento usando embeddings. Chaves do Groq não funcionam aqui.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="openai_api_key">OpenAI API Key</Label>
              <Input
                id="openai_api_key"
                name="openai_api_key"
                type="password"
                placeholder="sk-proj-..."
                defaultValue={initialData?.openai_api_key || ""}
              />
              <a href="https://platform.openai.com" target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground underline underline-offset-4 w-fit">
                Obter chave em platform.openai.com
              </a>
            </div>
            <input type="hidden" name="openrouter_api_key" defaultValue={initialData?.openrouter_api_key || ""} />
            <input type="hidden" name="groq_api_key" defaultValue={initialData?.groq_api_key || ""} />
            <input type="hidden" name="tavily_api_key" defaultValue={initialData?.tavily_api_key || ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar chave da OpenAI"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GroqModal({ initialData, onSaved }: { initialData: any, onSaved: (patch: any) => void }) {
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
      toast.success("Chave Groq salva!");
      onSaved({
        openrouter_api_key: initialData?.openrouter_api_key || null,
        openai_api_key: initialData?.openai_api_key || null,
        groq_api_key: (formData.get("groq_api_key") as string) || null,
        tavily_api_key: initialData?.tavily_api_key || null,
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Configurar</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Transcrição de Áudio — Groq</DialogTitle>
            <DialogDescription>
              Opcional mas recomendado. Permite transcrever áudios do WhatsApp instantaneamente e de graça usando Whisper via Groq.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="groq_api_key">Groq API Key</Label>
              <Input
                id="groq_api_key"
                name="groq_api_key"
                type="password"
                placeholder="gsk_..."
                defaultValue={initialData?.groq_api_key || ""}
              />
              <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground underline underline-offset-4 w-fit">
                Obter chave em console.groq.com
              </a>
            </div>
            <input type="hidden" name="openrouter_api_key" defaultValue={initialData?.openrouter_api_key || ""} />
            <input type="hidden" name="openai_api_key" defaultValue={initialData?.openai_api_key || ""} />
            <input type="hidden" name="tavily_api_key" defaultValue={initialData?.tavily_api_key || ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar chave do Groq"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TavilyModal({ initialData, onSaved }: { initialData: any, onSaved: (patch: any) => void }) {
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
      toast.success("Chave Tavily salva!");
      onSaved({
        openrouter_api_key: initialData?.openrouter_api_key || null,
        openai_api_key: initialData?.openai_api_key || null,
        groq_api_key: initialData?.groq_api_key || null,
        tavily_api_key: (formData.get("tavily_api_key") as string) || null,
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Configurar</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Pesquisa na Internet — Tavily</DialogTitle>
            <DialogDescription>
              Permite que a Safira pesquise informações atuais na internet em tempo real quando o usuário solicitar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tavily_api_key">Tavily API Key</Label>
              <Input
                id="tavily_api_key"
                name="tavily_api_key"
                type="password"
                placeholder="tvly-..."
                defaultValue={initialData?.tavily_api_key || ""}
              />
              <a href="https://tavily.com" target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground underline underline-offset-4 w-fit">
                Obter chave em tavily.com
              </a>
            </div>
            <input type="hidden" name="openrouter_api_key" defaultValue={initialData?.openrouter_api_key || ""} />
            <input type="hidden" name="openai_api_key" defaultValue={initialData?.openai_api_key || ""} />
            <input type="hidden" name="groq_api_key" defaultValue={initialData?.groq_api_key || ""} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Salvar chave do Tavily"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
