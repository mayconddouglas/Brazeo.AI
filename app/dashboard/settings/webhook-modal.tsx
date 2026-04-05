"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CopyIcon } from "lucide-react";

export function WebhookModal({ siteUrl }: { siteUrl: string }) {
  const webhookUrl = `${siteUrl}/api/webhook/evolution`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm">Ver Webhook</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuração Evolution API</DialogTitle>
          <DialogDescription>
            Para que o Brazeo.IA receba as mensagens do WhatsApp, você precisa configurar este Webhook na sua Evolution API.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>1. Copie a URL do Webhook</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={webhookUrl} className="bg-muted font-mono text-xs" />
              <Button size="icon" variant="secondary" onClick={() => copyToClipboard(webhookUrl)}>
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              No painel da Evolution, crie um Webhook colando essa URL e marque a opção "MESSAGES_UPSERT".
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Label>2. Variáveis na Vercel (Segurança)</Label>
            <p className="text-sm text-muted-foreground">
              Certifique-se de ter configurado as variáveis abaixo nas Configurações da Vercel (Settings &gt; Environment Variables):
            </p>
            <ul className="text-xs font-mono bg-muted p-2 rounded-md space-y-1">
              <li>EVOLUTION_API_URL=<span className="opacity-50">sua-api.com</span></li>
              <li>EVOLUTION_API_KEY=<span className="opacity-50">sua-chave-global</span></li>
              <li>EVOLUTION_INSTANCE_NAME=<span className="opacity-50">nome-da-instancia</span></li>
              <li>OPENROUTER_API_KEY=<span className="opacity-50">chave-openai-gpt4o</span></li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}