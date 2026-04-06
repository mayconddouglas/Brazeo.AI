import { ConversationsClient } from "./conversations-client";
import { getServiceSupabase } from "@/lib/supabase";

export const revalidate = 0;

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; query?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedUserId = resolvedParams.userId;
  const query = resolvedParams.query || "";
  const supabase = getServiceSupabase();

  // Buscar usuários e suas últimas mensagens usando a View otimizada
  let queryBuilder = supabase
    .from("view_users_with_last_message")
    .select("*")
    .not("last_message_id", "is", null);

  if (query) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
  }

  const { data: usersWithLastMessage } = await queryBuilder
    .order("last_message_created_at", { ascending: false });

  const activeConversations = usersWithLastMessage || [];
  const activeUserId = selectedUserId || activeConversations[0]?.id;
  const activeUser = activeConversations.find((u) => u.id === activeUserId);

  // Buscar histórico do usuário selecionado
  let messages: any[] = [];
  if (activeUserId) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", activeUserId)
      .order("created_at", { ascending: true });
    if (data) messages = data;
  }

  return (
    <ConversationsClient 
      initialConversations={activeConversations} 
      activeUser={activeUser} 
      activeUserId={activeUserId} 
      initialMessages={messages} 
      query={query} 
    />
  );
}
