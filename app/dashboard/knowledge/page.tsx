import { getServiceSupabase } from "@/lib/supabase";
import { KnowledgeClient } from "./knowledge-client";

export const revalidate = 0;

export default async function KnowledgePage() {
  const supabase = getServiceSupabase();

  // Buscar apenas o id, content e created_at para listar na UI
  const { data: knowledgeBase, error } = await supabase
    .from('knowledge_base')
    .select('id, content, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching knowledge base:", error);
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-2rem)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Base de Conhecimento (RAG)</h2>
        <p className="text-muted-foreground">Alimente o cérebro da Inteligência Artificial com informações importantes sobre sua empresa.</p>
      </div>

      <div className="flex-1 min-h-0">
        <KnowledgeClient knowledgeBase={knowledgeBase || []} />
      </div>
    </div>
  );
}