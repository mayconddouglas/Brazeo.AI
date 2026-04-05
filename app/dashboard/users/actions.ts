"use server";

import { getServiceSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addUser(formData: FormData) {
  const supabase = getServiceSupabase();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  if (!phone) return { error: "Telefone é obrigatório" };

  const { error } = await supabase.from("users").insert([{ name, phone, status: "active" }]);

  if (error) {
    if (error.code === '23505') { // Unique violation
      return { error: "Este telefone já está cadastrado." };
    }
    return { error: "Erro ao adicionar usuário." };
  }

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function updateUser(formData: FormData) {
  const supabase = getServiceSupabase();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const status = formData.get("status") as string;

  if (!id) return { error: "ID é obrigatório" };

  const { error } = await supabase
    .from("users")
    .update({ name, phone, status })
    .eq("id", id);

  if (error) return { error: "Erro ao atualizar usuário." };

  revalidatePath("/dashboard/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  const supabase = getServiceSupabase();
  
  if (!id) return { error: "ID é obrigatório" };

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) return { error: "Erro ao excluir usuário." };

  revalidatePath("/dashboard/users");
  return { success: true };
}