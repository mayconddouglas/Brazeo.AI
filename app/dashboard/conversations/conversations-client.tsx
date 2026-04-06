"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChatArea } from "./chat-area";
import { SearchInput } from "../users/search-input";
import { NewConversationDialog } from "./new-conversation-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { markMessagesAsRead } from "./actions";
import { useRouter } from "next/navigation";

export function ConversationsClient({
  initialConversations,
  activeUser,
  activeUserId,
  initialMessages,
  query
}: {
  initialConversations: any[];
  activeUser: any;
  activeUserId: string;
  initialMessages: any[];
  query: string;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const router = useRouter();

  // Marcar como lido ao abrir o chat (quando o activeUserId mudar)
  useEffect(() => {
    if (activeUserId && activeUser?.last_message_role === 'user') {
      // Chama a server action para atualizar o status no banco
      markMessagesAsRead(activeUserId).then((res) => {
        if (res.success) {
          // Atualiza a lista local otimisticamente (remove a bolinha azul)
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeUserId
                ? { ...c, last_message_role: 'system' } // Fake role to trick the UI into thinking it's read
                : c
            )
          );
        }
      });
    }
  }, [activeUserId, activeUser]);

  // Supabase Realtime para a lista de contatos
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Escuta novas mensagens para atualizar a sidebar
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;

          // Atualiza a lista de conversas colocando o remetente no topo
          setConversations((prev) => {
            const existingIndex = prev.findIndex((c) => c.id === newMsg.user_id);
            
            let updatedUser;
            if (existingIndex >= 0) {
              updatedUser = {
                ...prev[existingIndex],
                last_message_content: newMsg.content,
                last_message_created_at: newMsg.created_at,
                last_message_role: newMsg.role,
                last_message_id: newMsg.id,
                last_message_intent: newMsg.intent
              };
              
              const newList = [...prev];
              newList.splice(existingIndex, 1);
              return [updatedUser, ...newList]; // Coloca no topo
            } else {
              // Se é um usuário novo, idealmente precisaríamos buscar os dados do usuário (nome, telefone).
              // Por hora, para evitar requisição extra do cliente, forçamos um refresh da página via Next Router
              // para que o Server Component busque os dados completos.
              router.refresh();
              return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);


  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100dvh-56px)] bg-background overflow-hidden">
      
      {/* Lista de Contatos (Sidebar do Chat) */}
      <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r flex flex-col bg-muted/10 h-full ${activeUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">Conversas</h2>
            <NewConversationDialog />
          </div>
          <SearchInput />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {conversations.map((user) => {
              const isUnread = user.last_message_role === 'user';
              const name = user.name || "Desconhecido";
              const initials = name.substring(0, 2).toUpperCase();

              return (
                <Link
                  key={user.id}
                  href={`/dashboard/conversations?userId=${user.id}${query ? `&query=${query}` : ""}`}
                  className={`flex flex-col items-start gap-2 border-b p-4 text-left text-sm transition-all hover:bg-accent/50 ${
                    activeUserId === user.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex w-full items-start gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className={isUnread ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground"}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col flex-1 min-w-0 gap-1">
                      <div className="flex items-center justify-between w-full">
                        <div className={`font-medium truncate ${isUnread ? 'text-foreground font-semibold' : 'text-foreground/80'}`}>
                          {name}
                        </div>
                        <div className={`text-[10px] whitespace-nowrap ml-2 ${isUnread ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          {user.last_message_created_at ? formatDistanceToNow(new Date(user.last_message_created_at), { addSuffix: true, locale: ptBR }) : ""}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full">
                        <div className={`text-xs truncate flex-1 ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {user.last_message_role === 'assistant' ? '🤖 ' : ''}
                          {user.last_message_content}
                        </div>
                        
                        {isUnread && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 shadow-sm animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {conversations.length === 0 && (
              <div className="p-8 text-sm text-muted-foreground text-center flex flex-col items-center gap-2">
                <p>Nenhuma conversa encontrada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Área de Chat (Painel Principal) */}
      <div className={`flex-1 flex flex-col h-full bg-background relative ${!activeUserId ? 'hidden md:flex' : 'flex'}`}>
        {activeUser ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex-shrink-0 border-b flex items-center px-4 gap-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
              <Link href="/dashboard/conversations" className="md:hidden -ml-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              
              <Avatar className="h-9 w-9 border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {(activeUser.name || "UN").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{activeUser.name || "Desconhecido"}</span>
                  {activeUser.last_message_intent && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal capitalize">
                      {activeUser.last_message_intent.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground truncate">{activeUser.phone}</span>
              </div>
            </div>
            
            {/* Chat Area Component (Messages + Input) */}
            <ChatArea activeUser={activeUser} initialMessages={initialMessages} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-muted-foreground/50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.84 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <p className="text-lg font-medium text-foreground">Suas Mensagens</p>
            <p className="text-sm">Selecione uma conversa ao lado para visualizar.</p>
          </div>
        )}
      </div>
    </div>
  );
}