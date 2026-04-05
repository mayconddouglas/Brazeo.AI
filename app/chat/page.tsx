"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Phone } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Eu sou o Brazeo.IA. Como posso te ajudar hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("5511999999999");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !phone.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: userMessage }),
      });

      const data = await res.json();
      
      if (data.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Erro de comunicação com o servidor." }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro de rede." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-muted/20">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-background px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Brazeo.IA Web Chat</h1>
            <p className="text-xs text-muted-foreground">Simulador do WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-muted-foreground" />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-8 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Número (ex: 55119...)"
            title="Número de telefone simulado"
          />
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex w-max max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[75%] sm:text-base ${
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-background border rounded-tl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="flex w-max max-w-[85%] flex-col gap-2 rounded-2xl rounded-tl-sm border bg-background px-4 py-3 text-sm shadow-sm sm:max-w-[75%] sm:text-base">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t bg-background p-4 sm:p-6">
        <form onSubmit={handleSend} className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex h-12 w-full rounded-full border border-input bg-background px-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full"
            disabled={!input.trim() || isLoading}
          >
            <Send size={20} />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
