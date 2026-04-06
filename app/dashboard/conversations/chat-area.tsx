"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";
import { sendMessageFromDashboard } from "./actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendIcon, Loader2, Clock } from "lucide-react";

export function ChatArea({ activeUser, initialMessages }: { activeUser: any, initialMessages: any[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a mensagem mais recente
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeUser]);

  // Atualizar estado caso mude o usuário pela URL
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Realtime Supabase Setup
  useEffect(() => {
    if (!activeUser) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const channel = supabase
      .channel(`realtime:messages:${activeUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `user_id=eq.${activeUser.id}`
        },
        (payload) => {
          setMessages((prev) => {
            // Evitar duplicação da mensagem temporária
            const isDuplicate = prev.some(m => 
              m.id === payload.new.id || 
              (m.id.toString().startsWith('temp-') && m.content === payload.new.content && Math.abs(new Date(m.created_at).getTime() - new Date(payload.new.created_at).getTime()) < 5000)
            );
            
            if (isDuplicate) {
              // Substitui a temporária pela real
              return prev.map(m => 
                (m.id.toString().startsWith('temp-') && m.content === payload.new.content) ? payload.new : m
              );
            }
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeUser]);

  const handleSend = () => {
    if (!input.trim() || !activeUser) return;

    const text = input.trim();
    setInput("");

    // Otimismo visual: joga a mensagem na tela antes de confirmar do banco
    const tempMessage = {
      id: `temp-${Date.now()}`,
      user_id: activeUser.id,
      role: 'assistant',
      content: text,
      created_at: new Date().toISOString(),
      isTemp: true
    };
    
    setMessages((prev) => [...prev, tempMessage]);

    startTransition(async () => {
      const res = await sendMessageFromDashboard(activeUser.id, activeUser.phone, text);
      if (res.error) {
        alert(res.error);
        // Remove a mensagem temporária em caso de erro
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      }
    });
  };

  if (!activeUser) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Selecione uma conversa para visualizar.
      </div>
    );
  }

  return (
    <>
      <div 
        ref={scrollRef} 
        className="p-4 md:p-6 flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 scroll-smooth bg-muted/10 dark:bg-background"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user"; // "user" = cliente no WhatsApp
          const isTemp = msg.isTemp;
          
          // Lógica para agrupar mensagens e evitar cantos arredondados redundantes
          const prevMsg = messages[index - 1];
          const nextMsg = messages[index + 1];
          const isFirstInGroup = !prevMsg || prevMsg.role !== msg.role;
          const isLastInGroup = !nextMsg || nextMsg.role !== msg.role;

          return (
            <div
              key={msg.id}
              className={`flex w-max max-w-[85%] md:max-w-[70%] flex-col gap-1 px-4 py-2.5 text-[15px] shadow-sm transition-all ${
                isUser
                  ? "bg-card border self-start text-card-foreground"
                  : "bg-primary text-primary-foreground self-end"
              } ${
                isUser 
                  ? `rounded-2xl ${isFirstInGroup ? 'rounded-tl-md' : ''} ${isLastInGroup ? 'rounded-bl-md' : ''}` 
                  : `rounded-2xl ${isFirstInGroup ? 'rounded-tr-md' : ''} ${isLastInGroup ? 'rounded-br-md' : ''}`
              } ${isTemp ? "opacity-70" : "opacity-100"}`}
            >
              <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
              <div 
                className={`flex items-center gap-1 text-[11px] mt-0.5 select-none ${
                  isUser ? "text-muted-foreground justify-end" : "text-primary-foreground/80 justify-end"
                }`}
              >
                {isTemp && <Clock className="w-3 h-3" />}
                {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-muted-foreground">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Nenhuma mensagem</p>
              <p className="text-xs text-muted-foreground">Inicie uma conversa enviando uma mensagem abaixo.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto flex items-end gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Textarea
          placeholder="Mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isPending}
          className="flex-1 min-h-[44px] max-h-[160px] resize-none rounded-2xl bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 py-3 px-4 shadow-sm"
        />
        <Button 
          size="icon" 
          className="h-[44px] w-[44px] rounded-full shrink-0 shadow-sm transition-all"
          onClick={handleSend} 
          disabled={isPending || !input.trim()}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendIcon className="h-5 w-5 ml-0.5" />
          )}
          <span className="sr-only">Enviar</span>
        </Button>
      </div>
    </>
  );
}