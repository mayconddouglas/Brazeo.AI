"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendIcon, Trash2Icon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function TestAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "test-admin-dashboard",
          message: userMessage.content,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao gerar resposta");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao testar a Safira.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    toast.success("Histórico local limpo.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-4xl mx-auto w-full p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Testar Agente</h2>
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20">
              Modo Teste
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            As mensagens aqui não são salvas no histórico real dos usuários nem enviadas via WhatsApp.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleClear} disabled={messages.length === 0 || isLoading}>
          <Trash2Icon className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      <div className="flex-1 flex flex-col bg-card border rounded-lg overflow-hidden shadow-sm">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-col gap-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-10 opacity-50">
                <div className="p-4 bg-muted rounded-full">
                  <SendIcon className="h-6 w-6" />
                </div>
                <p className="text-sm">Envie uma mensagem para iniciar o teste da Safira.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-max max-w-[85%] md:max-w-[75%] flex-col gap-2 rounded-lg px-4 py-3 text-sm shadow-sm",
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  )}
                >
                  <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="bg-muted text-foreground rounded-lg rounded-bl-none px-4 py-4 w-fit shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t">
          <form
            onSubmit={handleSend}
            className="flex w-full items-center space-x-2"
          >
            <Input
              type="text"
              placeholder="Digite sua mensagem para a Safira..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}