"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireComandante() {
  const session = await getSession();
  if (!session || session.rol !== "comandante") redirect("/login");
}

export async function resetPassword(userId: string, formData: FormData) {
  await requireComandante();
  const nuevaPassword = (formData.get("password") as string).trim();
  if (!nuevaPassword || nuevaPassword.length < 4) {
    throw new Error("La contraseña debe tener al menos 4 caracteres");
  }

  const hash = await bcrypt.hash(nuevaPassword, 10);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ password_hash: hash })
    .eq("id", userId)
    .neq("rol", "comandante"); // Seguridad: no permite cambiar la contraseña del comandante desde aquí

  if (error) throw new Error(error.message);

  revalidatePath("/comandante/admin/usuarios");
  redirect("/comandante/admin/usuarios");
}
