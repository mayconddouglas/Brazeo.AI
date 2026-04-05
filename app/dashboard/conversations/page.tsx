import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServiceSupabase } from "@/lib/supabase";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const revalidate = 0;

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const selectedUserId = resolvedParams.userId;
  const supabase = getServiceSupabase();

  // Buscar todos os usuários que têm mensagens
  const { data: users } = await supabase
    .from("users")
    .select("id, name, phone")
    .order("created_at", { ascending: false });

  // Para cada usuário, buscar a última mensagem (simplificado)
  // Em um cenário real, faríamos uma query mais otimizada ou usaríamos uma view
  const usersWithLastMessage = await Promise.all(
    (users || []).map(async (user) => {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at, intent")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return { ...user, lastMessage: lastMsg };
    })
  );

  // Filtrar apenas usuários com mensagens e ordenar pela data da última mensagem
  const activeConversations = usersWithLastMessage
    .filter((u) => u.lastMessage !== null)
    .sort((a, b) => {
      // Usamos ! para garantir ao TS que não é nulo, pois já filtramos acima
      return new Date(b.lastMessage!.created_at).getTime() - new Date(a.lastMessage!.created_at).getTime();
    });

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
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-base">Usuários</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="flex flex-col">
              {activeConversations.map((user) => (
                <Link
                  key={user.id}
                  href={`/dashboard/conversations?userId=${user.id}`}
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
                        {user.lastMessage ? formatDistanceToNow(new Date(user.lastMessage.created_at), { addSuffix: true, locale: ptBR }) : ""}
                      </div>
                    </div>
                    {user.lastMessage?.intent && (
                      <div className="text-xs font-medium">{user.lastMessage.intent}</div>
                    )}
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">
                    {user.lastMessage?.content}
                  </div>
                </Link>
              ))}
              {activeConversations.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">Nenhuma conversa encontrada.</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 h-[600px] flex flex-col">
          {activeUser ? (
            <>
              <CardHeader className="border-b px-4 py-3 flex flex-row items-center">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{activeUser.name || "Sem Nome"}</CardTitle>
                  <span className="text-xs text-muted-foreground">{activeUser.phone}</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-auto flex flex-col gap-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-muted"
                        : "ml-auto bg-primary text-primary-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground mt-10">
                    Nenhuma mensagem neste histórico.
                  </div>
                )}
              </CardContent>
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
