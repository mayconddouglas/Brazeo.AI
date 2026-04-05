import { getServiceSupabase } from "@/lib/supabase";
import { BroadcastForm } from "./broadcast-form";
import { BroadcastHistory } from "./broadcast-history";

export const revalidate = 0;

export default async function BroadcastPage() {
  const supabase = getServiceSupabase();

  // Fetch broadcasts history
  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch active users for targeting
  const { data: activeUsers } = await supabase
    .from("users")
    .select("id, name, phone")
    .eq("status", "active")
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Broadcast</h2>
        <p className="text-muted-foreground">Crie, agende e gerencie disparos de mensagens em massa.</p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <BroadcastForm activeUsers={activeUsers || []} />
        <BroadcastHistory broadcasts={broadcasts || []} totalActiveUsers={activeUsers?.length || 0} />
      </div>
    </div>
  );
}
