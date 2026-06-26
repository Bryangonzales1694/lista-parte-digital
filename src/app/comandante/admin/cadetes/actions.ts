"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireComandante() {
  const session = await getSession();
  if (!session || session.rol !== "comandante") redirect("/login");
}

export async function createCadete(formData: FormData) {
  await requireComandante();
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  const grado = formData.get("grado") as string;
  const compania = formData.get("compania") as string;
  const seccion = formData.get("seccion") as string;

  if (!nombre || !grado || !compania || !seccion) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("cadetes").insert({
    nombre,
    grado,
    compania,
    seccion,
    activo: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/comandante/admin/cadetes");
  redirect("/comandante/admin/cadetes");
}

export async function updateCadete(id: string, formData: FormData) {
  await requireComandante();
  const nombre = (formData.get("nombre") as string).trim().toUpperCase();
  const grado = formData.get("grado") as string;
  const compania = formData.get("compania") as string;
  const seccion = formData.get("seccion") as string;

  if (!nombre || !grado || !compania || !seccion) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("cadetes")
    .update({ nombre, grado, compania, seccion })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/comandante/admin/cadetes");
  redirect("/comandante/admin/cadetes");
}

export async function toggleActivoCadete(id: string, activoActual: boolean) {
  await requireComandante();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("cadetes")
    .update({ activo: !activoActual })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/comandante/admin/cadetes");
  redirect("/comandante/admin/cadetes");
}
