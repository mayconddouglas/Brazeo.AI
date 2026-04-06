"use server";

import { getServiceSupabase } from "@/lib/supabase";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";

export async function addKnowledgeAction(formData: FormData) {
  const content = formData.get("content") as string;
  if (!content || content.trim().length < 10) {
    return { error: "O texto é muito curto. Forneça um conteúdo válido." };
  }

  const supabase = getServiceSupabase();

  try {
    // 1. Fetch OpenAI API key
    const { data: settings } = await supabase.from('settings').select('openai_api_key').eq('id', 1).single();
    const apiKey = settings?.openai_api_key || process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.startsWith('gsk_')) {
      return { error: "Você precisa configurar uma API Key da OpenAI (sk-...) válida no painel para gerar Embeddings. Chaves do Groq não suportam Embeddings." };
    }

    const openai = new OpenAI({ apiKey });

    // 2. Simple chunking strategy (split by paragraphs)
    const rawChunks = content.split(/\n\s*\n/);
    const chunks = rawChunks
      .map(c => c.trim())
      .filter(c => c.length > 20); // ignore very tiny artifacts

    if (chunks.length === 0) {
      return { error: "Não foi possível extrair parágrafos válidos do texto." };
    }

    // 3. Generate embeddings
    // We batch process them to avoid hitting rate limits on simple tiers, but for small texts a single call is fine.
    // OpenAI supports array of strings for embeddings.
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
      dimensions: 1536,
    });

    // 4. Prepare data for Supabase
    const inserts = response.data.map((embeddingData, index) => ({
      content: chunks[index],
      embedding: embeddingData.embedding,
      metadata: { source: "manual_input" }
    }));

    // 5. Insert into Supabase knowledge_base table
    const { error: insertError } = await supabase
      .from('knowledge_base')
      .insert(inserts);

    if (insertError) {
      console.error("Erro ao salvar no Supabase:", insertError);
      return { error: `Erro no Banco de Dados: ${insertError.message}` };
    }

    revalidatePath("/dashboard/knowledge");
    return { success: true, count: chunks.length };

  } catch (error: any) {
    console.error("Error adding knowledge:", error);
    return { error: `Erro na integração: ${error.message}` };
  }
}

export async function deleteKnowledgeAction(id: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('knowledge_base').delete().eq('id', id);
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath("/dashboard/knowledge");
  return { success: true };
}