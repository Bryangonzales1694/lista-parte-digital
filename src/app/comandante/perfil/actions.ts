"use server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

export async function cambiarContrasenaPropia(formData: FormData) {
  const session = await getSession();
  if (!session || session.rol !== "comandante") redirect("/login");

  const nueva = (formData.get("password") as string).trim();
  if (!nueva || nueva.length < 4) return;

  const hash = await bcrypt.hash(nueva, 10);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ password_hash: hash })
    .eq("id", session.id);

  if (error) throw new Error(error.message);
  redirect("/comandante");
}
