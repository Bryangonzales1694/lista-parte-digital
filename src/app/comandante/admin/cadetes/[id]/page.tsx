export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateCadete, toggleActivoCadete } from "../actions";
import { GRADO_OPTIONS, COMPANIA_OPTIONS, SECCION_OPTIONS } from "../options";

const INPUT_CLS =
  "w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
const SELECT_CLS =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
const LABEL_CLS =
  "block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1";

export default async function EditarCadetePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: cadete } = await supabase
    .from("cadetes")
    .select("id, nombre, grado, compania, seccion, activo")
    .eq("id", id)
    .single();

  if (!cadete) return notFound();

  const editAction = updateCadete.bind(null, cadete.id);
  const toggleAction = toggleActivoCadete.bind(null, cadete.id, cadete.activo);

  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <Link
            href="/comandante/admin/cadetes"
            className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700"
          >
            ← Cadetes
          </Link>
          <h1 className="text-base font-bold text-neutral-900">
            Editar Cadete
          </h1>
        </div>
      </header>

      {!cadete.activo && (
        <div className="mx-4 mt-4 rounded-xl bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-700">
            Este cadete está dado de baja y no aparece en ninguna lista activa.
          </p>
        </div>
      )}

      <form
        action={editAction}
        className="mx-4 mt-4 space-y-4 rounded-2xl bg-white p-5 shadow"
      >
        <div>
          <label className={LABEL_CLS}>Apellidos y Nombre</label>
          <input
            type="text"
            name="nombre"
            required
            defaultValue={cadete.nombre}
            className={INPUT_CLS}
            autoCapitalize="characters"
          />
        </div>

        <div>
          <label className={LABEL_CLS}>Grado</label>
          <select name="grado" required defaultValue={cadete.grado} className={SELECT_CLS}>
            {GRADO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Compañía</label>
          <select name="compania" required defaultValue={cadete.compania} className={SELECT_CLS}>
            {COMPANIA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Sección</label>
          <select name="seccion" required defaultValue={cadete.seccion ?? ""} className={SELECT_CLS}>
            {SECCION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition-transform duration-100 active:scale-95"
        >
          Guardar cambios
        </button>
      </form>

      {/* Dar de baja / Reactivar */}
      <div className="mx-4 mt-4 rounded-2xl bg-white p-5 shadow">
        <p className="mb-3 text-sm font-semibold text-neutral-800">
          {cadete.activo ? "Dar de baja" : "Reactivar cadete"}
        </p>
        <p className="mb-4 text-xs text-neutral-500">
          {cadete.activo
            ? "El cadete dejará de aparecer en futuras listas y partes. El historial anterior se conserva intacto."
            : "El cadete volverá a aparecer en las listas y partes desde el próximo ingreso."}
        </p>
        <form action={toggleAction}>
          <button
            type="submit"
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-transform duration-100 active:scale-95 ${
              cadete.activo
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-800"
            }`}
          >
            {cadete.activo ? "Dar de baja" : "Reactivar"}
          </button>
        </form>
      </div>
    </main>
  );
}
