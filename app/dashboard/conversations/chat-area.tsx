"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@supabase/supabase-js";
import { sendMessageFromDashboard } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";

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

    // Precisamos do cliente público para assinar eventos (apenas leitura do schema)
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
          // Quando chega uma mensagem nova do DB, atualizamos o state sem precisar dar F5
          setMessages((prev) => {
            // Evitar duplicação se o dashboard que enviou
            if (prev.some(m => m.id === payload.new.id)) return prev;
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
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, tempMessage]);

    startTransition(async () => {
      const res = await sendMessageFromDashboard(activeUser.id, activeUser.phone, text);
      if (res.error) {
        alert(res.error);
        // Em um app real, poderíamos remover a tempMessage ou marcá-a como "falhou"
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
      <div ref={scrollRef} className="p-4 flex-1 overflow-auto flex flex-col gap-4 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-max max-w-[75%] flex-col gap-1 rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-muted self-start"
                : "bg-primary text-primary-foreground self-end"
            }`}
          >
            <div>{msg.content}</div>
            <div className={`text-[10px] opacity-70 ${msg.role === "user" ? "text-right" : "text-right"}`}>
              {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-10">
            Nenhuma mensagem neste histórico.
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-background mt-auto flex items-center gap-2">
        <Input
          placeholder="Digite sua mensagem para enviar via WhatsApp..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isPending}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={isPending || !input.trim()}>
          <SendIcon className="h-4 w-4" />
          <span className="sr-only">Enviar</span>
        </Button>
      </div>
    </>
  );
}