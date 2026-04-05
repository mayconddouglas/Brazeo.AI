"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrashIcon, PlayIcon, RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteBroadcastAction, sendNowAction } from "./actions";

export function BroadcastHistory({ broadcasts }: { broadcasts: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este envio?")) {
      startTransition(async () => {
        const res = await deleteBroadcastAction(id);
        if (res.error) toast.error(res.error);
        else toast.success("Broadcast excluído.");
      });
    }
  };

  const handleSendNow = (id: string) => {
    if (confirm("Deseja iniciar o disparo agora mesmo?")) {
      startTransition(async () => {
        const res = await sendNowAction(id);
        if (res.error) toast.error(res.error);
        else toast.success("Disparo iniciado com sucesso!");
      });
    }
  };

  const handleDuplicate = (msg: string) => {
    // Copy the message to the clipboard or let the user know they can just copy
    navigator.clipboard.writeText(msg);
    toast.success("Mensagem copiada! Cole no campo ao lado para reenviar.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Envios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-auto pr-2">
          {broadcasts?.map((broadcast) => (
            <div key={broadcast.id} className="flex flex-col gap-2 border-b pb-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Para: {broadcast.target === 'all' ? 'Todos os Usuários' : 'Usuários Específicos'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              
              <div className="text-sm bg-muted/50 p-2 rounded-md text-foreground">
                {broadcast.message}
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${
                    broadcast.status === 'sent' ? 'bg-green-500/20 text-green-700' : 
                    broadcast.status === 'processing' ? 'bg-blue-500/20 text-blue-700 animate-pulse' :
                    'bg-yellow-500/20 text-yellow-700'
                  }`}>
                    {broadcast.status === 'draft' ? 'Rascunho' : 
                     broadcast.status === 'scheduled' ? 'Agendado' : 
                     broadcast.status === 'processing' ? 'Processando...' : 'Enviado'}
                  </span>
                  
                  {broadcast.scheduled_at && broadcast.status !== 'sent' && (
                     <span className="text-[10px] text-muted-foreground">
                       Para: {new Date(broadcast.scheduled_at).toLocaleString('pt-BR')}
                     </span>
                  )}
                  {broadcast.sent_at && broadcast.status === 'sent' && (
                     <span className="text-[10px] text-muted-foreground">
                       Em: {new Date(broadcast.sent_at).toLocaleString('pt-BR')}
                     </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {(broadcast.status === 'draft' || broadcast.status === 'scheduled') && (
                    <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => handleSendNow(broadcast.id)} disabled={isPending} title="Enviar Agora">
                      <PlayIcon className="h-3 w-3 text-green-600" />
                    </Button>
                  )}
                  <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => handleDuplicate(broadcast.message)} disabled={isPending} title="Copiar p/ Reenviar">
                    <RefreshCwIcon className="h-3 w-3 text-blue-600" />
                  </Button>
                  <Button variant="outline" size="icon-sm" className="h-7 w-7" onClick={() => handleDelete(broadcast.id)} disabled={isPending} title="Excluir">
                    <TrashIcon className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!broadcasts?.length && (
            <div className="text-sm text-muted-foreground text-center p-4">
              Nenhum broadcast encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}