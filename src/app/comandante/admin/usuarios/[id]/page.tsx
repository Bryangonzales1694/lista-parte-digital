export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { resetPassword } from "../actions";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, username, nombre, rol, compania_asignada, seccion_asignada")
    .eq("id", id)
    .neq("rol", "comandante")
    .single();

  if (!usuario) return notFound();

  const resetAction = resetPassword.bind(null, usuario.id);

  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <Link
            href="/comandante/admin/usuarios"
            className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700"
          >
            ← Usuarios
          </Link>
          <h1 className="text-base font-bold text-neutral-900">
            Resetear contraseña
          </h1>
        </div>
      </header>

      <div className="mx-4 mt-6 rounded-2xl bg-white p-5 shadow">
        <div className="mb-5 border-b border-neutral-100 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Usuario
          </p>
          <p className="mt-1 text-base font-bold text-neutral-900">
            {usuario.username}
          </p>
          <p className="text-sm text-neutral-500">
            {usuario.compania_asignada ?? "—"}
            {usuario.seccion_asignada ? ` · ${usuario.seccion_asignada}` : ""}
          </p>
        </div>

        <form action={resetAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
              Nueva contraseña
            </label>
            <input
              type="text"
              name="password"
              required
              minLength={4}
              placeholder="Mínimo 4 caracteres"
              autoComplete="off"
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="mt-1 text-xs text-neutral-400">
              El campo es visible para que puedas confirmar lo que escribes antes de guardar.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition-transform duration-100 active:scale-95"
          >
            Guardar nueva contraseña
          </button>
        </form>
      </div>
    </main>
  );
}
