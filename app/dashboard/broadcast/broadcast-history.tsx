"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrashIcon, PlayIcon, CopyIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteBroadcastAction, sendNowAction } from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function BroadcastHistory({ broadcasts, totalActiveUsers }: { broadcasts: any[], totalActiveUsers: number }) {
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
    navigator.clipboard.writeText(msg);
    toast.success("Mensagem copiada para a área de transferência!");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b pb-4">
        <CardTitle>Histórico de Envios</CardTitle>
        <CardDescription>Visualize o status e gerencie os disparos anteriores.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[600px] w-full">
          <div className="flex flex-col p-4 gap-4">
            {broadcasts?.map((broadcast) => (
              <div key={broadcast.id} className="flex flex-col gap-3 rounded-lg border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm flex items-center gap-2">
                      Para: {broadcast.target === 'all' ? 'Todos os Usuários' : 'Usuários Específicos'}
                      <Badge variant="secondary" className="text-[10px]">
                        {broadcast.target === 'all' ? totalActiveUsers : broadcast.target_users?.length || 0} contatos
                      </Badge>
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                
                <div className="text-sm bg-muted/30 border p-3 rounded-md text-foreground whitespace-pre-wrap">
                  {broadcast.message}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      broadcast.status === 'sent' ? 'default' : 
                      broadcast.status === 'processing' ? 'secondary' : 'outline'
                    } className={broadcast.status === 'sent' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                      {broadcast.status === 'draft' ? 'Rascunho' : 
                       broadcast.status === 'scheduled' ? 'Agendado' : 
                       broadcast.status === 'processing' ? 'Processando...' : 'Enviado'}
                    </Badge>
                    
                    {broadcast.scheduled_at && broadcast.status !== 'sent' && (
                       <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                         <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                         {new Date(broadcast.scheduled_at).toLocaleString('pt-BR')}
                       </span>
                    )}
                    {broadcast.sent_at && broadcast.status === 'sent' && (
                       <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                         <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                         {new Date(broadcast.sent_at).toLocaleString('pt-BR')}
                       </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {(broadcast.status === 'draft' || broadcast.status === 'scheduled') && (
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSendNow(broadcast.id)} disabled={isPending} title="Enviar Agora">
                        <PlayIcon className="h-4 w-4 text-emerald-600" />
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(broadcast.message)} disabled={isPending} title="Copiar p/ Reenviar">
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(broadcast.id)} disabled={isPending} title="Excluir">
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {!broadcasts?.length && (
              <div className="text-sm text-muted-foreground flex flex-col items-center justify-center py-10 gap-2 border border-dashed rounded-lg">
                <span>Nenhum broadcast encontrado.</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}