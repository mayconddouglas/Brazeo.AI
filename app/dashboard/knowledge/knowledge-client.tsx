"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { addKnowledgeAction, deleteKnowledgeAction } from "./actions";
import { Trash2, Search, BookOpen, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function KnowledgeClient({ knowledgeBase = [] }: { knowledgeBase: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(e.currentTarget);
    const res = await addKnowledgeAction(formData);
    
    setIsPending(false);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`Conhecimento salvo! ${res?.count} parágrafo(s) indexado(s).`);
      e.currentTarget.reset();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await deleteKnowledgeAction(id);
    setDeletingId(null);

    if (res?.error) {
      toast.error("Erro ao deletar: " + res.error);
    } else {
      toast.success("Informação removida do cérebro da IA.");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_350px] lg:grid-cols-[1fr_400px] h-full">
      <div className="flex flex-col gap-6">
        <Card className="flex-1 overflow-hidden flex flex-col border-dashed shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Ensinar a Inteligência Artificial</CardTitle>
              <CardDescription>
                Cole abaixo informações sobre sua empresa, como políticas de devolução, horário de funcionamento, manuais, 
                ou regras de negócio. A IA usará esse texto para responder seus clientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <Textarea 
                name="content"
                placeholder="Exemplo: Nossa política de troca permite devoluções em até 7 dias úteis após a compra, desde que o produto esteja na embalagem original..."
                className="min-h-[300px] h-full resize-none text-base p-4 bg-muted/20"
                required
              />
            </CardContent>
            <CardFooter className="pt-2 pb-6 border-t bg-muted/10">
              <Button type="submit" size="lg" className="w-full sm:w-auto mt-4" disabled={isPending}>
                {isPending ? "Processando e Gerando Embeddings..." : "Salvar no Cérebro da IA"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="flex flex-col h-full gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg tracking-tight">Conhecimentos Salvos</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pb-10">
          {knowledgeBase.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-xl h-[300px]">
              <Search className="h-10 w-10 mb-4 opacity-20" />
              <p className="text-sm font-medium">A base de conhecimento está vazia.</p>
              <p className="text-xs mt-1 max-w-[200px]">Os textos que você salvar aparecerão aqui divididos em blocos de memória.</p>
            </div>
          ) : (
            knowledgeBase.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <CardContent className="p-4 relative">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm leading-relaxed text-foreground/80 line-clamp-4">
                      "{item.content}"
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                    <Badge variant="secondary" className="font-mono text-[9px] px-1.5 bg-primary/5 text-primary">vector_1536</Badge>
                    <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}