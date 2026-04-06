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
          <DialogTitle>Passo a passo da Integração</DialogTitle>
          <DialogDescription>
            Para que o Brazeo.IA receba as mensagens do WhatsApp, você precisa configurar este Webhook na sua Evolution API.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>1. Copie a URL do Webhook</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={webhookUrl} className="bg-muted font-mono text-xs flex-1" />
              <Button size="icon" variant="secondary" onClick={() => copyToClipboard(webhookUrl)} className="shrink-0">
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              No painel da Evolution, vá na sua instância, crie um novo Webhook colando a URL acima e marque <strong>apenas</strong> a opção <span className="font-mono bg-muted px-1 py-0.5 rounded">MESSAGES_UPSERT</span>.
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Label>2. Salve as Credenciais no Painel</Label>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Após configurar o Webhook na Evolution, clique no botão <strong>Configurar</strong> ao lado na tela de Integrações para inserir a URL da sua API, a Global API Key e o Nome da Instância.
            </p>
            <div className="text-xs font-medium text-emerald-600 bg-emerald-500/10 p-3 rounded-md mt-2">
              Dica: O sistema priorizará automaticamente as credenciais salvas aqui no painel em vez das variáveis da Vercel. Você não precisa mais reiniciar o servidor!
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}