"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function cancelReminderAction(id: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from('reminders')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/reminders");
  return { success: true };
}