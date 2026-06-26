"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type Rol,
} from "@/lib/auth/session";

function homePathForRol(rol: Rol) {
  if (rol === "seccion") return "/seccion";
  if (rol === "compania") return "/compania";
  return "/comandante";
}

export type LoginState = { error: string } | null;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Ingresa usuario y contraseña." };
  }

  const supabase = createAdminClient();
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("id, nombre, rol, seccion_asignada, compania_asignada, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (error || !usuario) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const passwordOk = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordOk) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const token = await createSessionToken({
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
    seccionAsignada: usuario.seccion_asignada,
    companiaAsignada: usuario.compania_asignada,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(homePathForRol(usuario.rol as Rol));
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
