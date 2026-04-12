"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Brain, Database, Mic, Globe } from "lucide-react";
import { EvolutionModal, OpenRouterModal } from "./integration-modals";
import { WebhookModal } from "./webhook-modal";

export function IntegrationCards({ settings, siteUrl }: { settings: any, siteUrl: string }) {
  const hasEvolutionApi = !!settings?.evolution_api_key || (!!process.env.EVOLUTION_API_KEY && !!process.env.EVOLUTION_API_URL);
  const hasOpenRouterApi = !!settings?.openrouter_api_key || !!process.env.OPENROUTER_API_KEY;
  const hasOpenAiApi = !!settings?.openai_api_key || !!process.env.OPENAI_API_KEY;
  const hasGroqApi = !!settings?.groq_api_key || !!process.env.GROQ_API_KEY;
  const hasTavilyApi = !!settings?.tavily_api_key || !!process.env.TAVILY_API_KEY;

  const StatusBadge = ({ active }: { active: boolean }) => (
    <Badge variant={active ? "default" : "secondary"} className={active ? "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" : ""}>
      {active ? "Conectado" : "Não configurado"}
    </Badge>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Evolution API */}
      <Card className="flex flex-col h-full">
        <CardContent className="p-6 flex flex-col flex-grow gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-none">WhatsApp</h3>
                <p className="text-sm text-muted-foreground mt-1">Evolution API</p>
              </div>
            </div>
            <StatusBadge active={hasEvolutionApi} />
          </div>
          <p className="text-sm text-muted-foreground flex-grow">
            Conecta o agente ao WhatsApp para enviar e receber mensagens, áudios e imagens.
          </p>
          <div className="flex items-center gap-2 mt-auto pt-4">
            <EvolutionModal initialData={settings} siteUrl={siteUrl} />
            {hasEvolutionApi && <WebhookModal siteUrl={siteUrl} />}
          </div>
        </CardContent>
      </Card>

      {/* OpenRouter */}
      <Card className="flex flex-col h-full">
        <CardContent className="p-6 flex flex-col flex-grow gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Brain className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-none">Modelo de IA</h3>
                <p className="text-sm text-muted-foreground mt-1">OpenRouter</p>
              </div>
            </div>
            <StatusBadge active={hasOpenRouterApi} />
          </div>
          <p className="text-sm text-muted-foreground flex-grow">
            O cérebro principal do agente (Claude, GPT-4, etc) para gerar as respostas inteligentes.
          </p>
          <div className="mt-auto pt-4">
            <OpenRouterModal initialData={settings} />
          </div>
        </CardContent>
      </Card>

      {/* OpenAI */}
      <Card className="flex flex-col h-full">
        <CardContent className="p-6 flex flex-col flex-grow gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Database className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-none">Base de Conhecimento</h3>
                <p className="text-sm text-muted-foreground mt-1">OpenAI Embeddings</p>
              </div>
            </div>
            <StatusBadge active={hasOpenAiApi} />
          </div>
          <p className="text-sm text-muted-foreground flex-grow">
            Vetorização matemática para permitir que a IA leia e entenda os documentos da empresa (RAG).
          </p>
          <div className="mt-auto pt-4">
            <OpenRouterModal initialData={settings} />
          </div>
        </CardContent>
      </Card>

      {/* Groq */}
      <Card className="flex flex-col h-full">
        <CardContent className="p-6 flex flex-col flex-grow gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Mic className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-none">Transcrição de Áudio</h3>
                <p className="text-sm text-muted-foreground mt-1">Groq Whisper</p>
              </div>
            </div>
            <StatusBadge active={hasGroqApi} />
          </div>
          <p className="text-sm text-muted-foreground flex-grow">
            Transcreve os áudios enviados pelos clientes no WhatsApp em milissegundos.
          </p>
          <div className="mt-auto pt-4">
            <OpenRouterModal initialData={settings} />
          </div>
        </CardContent>
      </Card>

      {/* Tavily */}
      <Card className="flex flex-col h-full">
        <CardContent className="p-6 flex flex-col flex-grow gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Globe className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-none">Pesquisa na Internet</h3>
                <p className="text-sm text-muted-foreground mt-1">Tavily</p>
              </div>
            </div>
            <StatusBadge active={hasTavilyApi} />
          </div>
          <p className="text-sm text-muted-foreground flex-grow">
            Dá acesso em tempo real à internet para o agente buscar notícias, clima e informações atualizadas.
          </p>
          <div className="mt-auto pt-4">
            <OpenRouterModal initialData={settings} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}