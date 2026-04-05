import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChatArea } from "./chat-area";
import { SearchInput } from "../users/search-input";

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Conversas</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1 h-[600px] overflow-hidden flex flex-col">
          <CardHeader className="border-b px-4 py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Usuários</CardTitle>
          </CardHeader>
          <div className="p-2 border-b bg-muted/50">
            <SearchInput />
          </div>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="flex flex-col">
              {activeConversations.map((user) => (
                <Link
                  key={user.id}
                  href={`/dashboard/conversations?userId=${user.id}${query ? `&query=${query}` : ""}`}
                  className={`flex flex-col items-start gap-2 border-b p-4 text-left text-sm transition-all hover:bg-accent ${
                    activeUserId === user.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{user.name || "Sem Nome"}</div>
                      </div>
                      <div className="ml-auto text-xs text-muted-foreground">
                        {user.last_message_created_at ? formatDistanceToNow(new Date(user.last_message_created_at), { addSuffix: true, locale: ptBR }) : ""}
                      </div>
                    </div>
                    {user.last_message_intent && (
                      <div className="text-xs font-medium">{user.last_message_intent}</div>
                    )}
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">
                    {user.last_message_content}
                  </div>
                </Link>
              ))}
              {activeConversations.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">Nenhuma conversa encontrada.</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 h-[600px] flex flex-col relative">
          {activeUser ? (
            <>
              <CardHeader className="border-b px-4 py-3 flex flex-row items-center">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{activeUser.name || "Sem Nome"}</CardTitle>
                  <span className="text-xs text-muted-foreground">{activeUser.phone}</span>
                </div>
              </CardHeader>
              <ChatArea activeUser={activeUser} initialMessages={messages} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
              Selecione uma conversa para visualizar.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
