"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { User, Clock, Calendar, BrainCircuit, Activity, MessageSquare } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { updateUserNotesAction, getUserMessagesAction } from "./actions";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return "Nunca";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `há ${diffInSeconds} seg`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours} horas`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "há 1 dia";
  return `há ${diffInDays} dias`;
}

const intentLabels: Record<string, string> = {
  'criar_lembrete': 'Lembretes',
  'planejar_semana': 'Planejador',
  'resposta_livre': 'Conversa Livre',
  'pesquisa_internet': 'Pesquisa Web',
  'suporte': 'Suporte',
  'saudacao': 'Saudação',
};

function formatIntentName(intent: string) {
  if (!intent) return 'Outros';
  return intentLabels[intent] || intent.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function UserProfileSheet({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(user.preferences?.admin_notes || "");
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);

  const initials = user.name ? user.name.substring(0, 2).toUpperCase() : "U";
  const aiMemories = user.preferences?.perfil || [];
  const birthday = user.preferences?.aniversario || "Não informado";

  useEffect(() => {
    if (isOpen && !messagesLoaded) {
      setIsLoadingMessages(true);
      getUserMessagesAction(user.id).then(data => {
        setMessages(data);
        setMessagesLoaded(true);
        setIsLoadingMessages(false);
      });
    }
  }, [isOpen, user.id, messagesLoaded]);

  const handleSaveNotes = () => {
    startTransition(async () => {
      const res = await updateUserNotesAction(user.id, notes);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Notas internas salvas!");
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3">
        Ver Perfil
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <SheetTitle className="text-xl">{user.name || "Sem Nome"}</SheetTitle>
              <span className="text-sm text-muted-foreground">{user.phone}</span>
              <div className="mt-1">
                <Badge variant={
                  user.status === "active" ? "default" :
                  user.status === "waitlist" ? "secondary" : "destructive"
                } className={
                  user.status === "active" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-transparent" :
                  user.status === "waitlist" ? "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-transparent" : ""
                }>
                  {user.status === "active" ? "Ativo" : 
                   user.status === "waitlist" ? "Lista de Espera" : "Bloqueado"}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Cadastro</span>
                </div>
                <span className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Visto</span>
                </div>
                <span className="text-sm font-medium">
                  {formatRelativeTime(user.last_seen_at)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Memórias da IA</h4>
              </div>
              {aiMemories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {aiMemories.map((mem: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-background">
                      {mem}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Nenhuma memória extraída ainda.</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <User className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Dados Adicionais</h4>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Aniversário</span>
                <span className="text-sm">{birthday}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 flex flex-col h-full">
            <div className="flex flex-col gap-2 flex-1">
              <p className="text-sm text-muted-foreground">
                Adicione observações internas sobre este usuário. O usuário não tem acesso a essas informações.
              </p>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Cliente VIP, pediu para não receber bom dia, etc..."
                className="min-h-[250px] resize-none"
              />
            </div>
            <Button 
              onClick={handleSaveNotes} 
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Salvando..." : "Salvar Notas"}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Últimas 5 mensagens
              </h4>
            </div>
            
            {isLoadingMessages ? (
              <div className="flex justify-center py-8">
                <span className="text-sm text-muted-foreground animate-pulse">Carregando histórico...</span>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/50">
                      <Badge variant="outline" className="text-[10px] font-normal bg-background flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {formatIntentName(msg.intent)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem encontrada.</p>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}