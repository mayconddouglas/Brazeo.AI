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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Broadcast</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <BroadcastForm activeUsers={activeUsers || []} />
        <BroadcastHistory broadcasts={broadcasts || []} />
      </div>
    </div>
  );
}
