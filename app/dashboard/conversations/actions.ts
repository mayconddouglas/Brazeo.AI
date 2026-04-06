"use server";

import { getServiceSupabase } from "@/lib/supabase";

export async function startNewConversation(name: string, phone: string, initialMessage: string) {
  if (!name || !phone || !initialMessage) return { error: "Parâmetros inválidos" };

  const supabase = getServiceSupabase();

  try {
    // 1. Verificar se usuário já existe
    let userId;
    const { data: existingUser } = await supabase.from('users').select('id').eq('phone', phone).single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // 2. Se não existe, cria um novo usuário
      const { data: newUser, error: createUserError } = await supabase.from('users').insert([{
        name,
        phone,
      }]).select().single();

      if (createUserError) throw createUserError;
      userId = newUser.id;
    }

    // 3. Usa a mesma lógica de envio de mensagem já existente
    const result = await sendMessageFromDashboard(userId, phone, initialMessage);
    
    if (result.error) throw new Error(result.error);

    return { success: true, userId };
  } catch (error) {
    console.error("Erro ao iniciar nova conversa:", error);
    return { error: "Falha ao iniciar conversa. Verifique os dados e tente novamente." };
  }
}

export async function markMessagesAsRead(userId: string) {
  if (!userId) return { error: "ID de usuário inválido" };

  const supabase = getServiceSupabase();

  try {
    // Busca a última mensagem desse usuário
    const { data: lastMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // Se a última mensagem for do usuário e não estiver marcada como lida (aqui usaremos um update em todas as mensagens do user que não tem is_read)
    // Como não temos um campo is_read explícito no momento, uma forma de "marcar como lido" no contexto atual
    // é registrar uma mensagem de "sistema" invisível ou atualizar um campo 'last_read_at' na tabela users.
    // Para simplificar a UI que verifica "user.last_message_role === 'user'", podemos inserir uma mensagem de sistema "Lido" (oculta)
    // ou atualizar o perfil do usuário. A melhor abordagem real seria adicionar uma coluna 'is_read' boolean default false.
    
    // Vamos atualizar a tabela 'users' para registrar a última vez que o admin abriu a conversa
    const { error: updateError } = await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() }) // Usando updated_at como timestamp de leitura para não quebrar schema
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar como lido:", error);
    return { error: "Falha ao atualizar status." };
  }
}

export async function sendMessageFromDashboard(userId: string, phone: string, content: string) {
  if (!userId || !phone || !content) return { error: "Parâmetros inválidos" };

  const supabase = getServiceSupabase();

  try {
    // 1. Salvar no banco como 'assistant' (pois está sendo enviado do painel)
    const { data: msg, error: dbError } = await supabase.from('messages').insert([{
      user_id: userId,
      role: 'assistant',
      content: content,
      intent: 'resposta_manual_dashboard'
    }]).select().single();

    if (dbError) throw dbError;

    // 2. Enviar mensagem via Evolution API
    const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();

    const apiUrl = settings?.evolution_api_url || process.env.EVOLUTION_API_URL;
    const apiKey = settings?.evolution_api_key || process.env.EVOLUTION_API_KEY;
    const instance = settings?.evolution_instance_name || process.env.EVOLUTION_INSTANCE_NAME;

    if (apiUrl && apiKey && instance) {
      await fetch(`${apiUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number: phone,
          options: {
            delay: 1000,
            presence: 'composing'
          },
          textMessage: {
            text: content
          }
        })
      });
    } else {
      console.warn("Credenciais da Evolution API não encontradas. A mensagem foi salva no banco mas não foi disparada para o WhatsApp.");
    }

    return { success: true, message: msg };
  } catch (error) {
    console.error("Erro ao enviar mensagem manual:", error);
    return { error: "Falha ao enviar mensagem." };
  }
}