export const dynamic = "force-dynamic";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GRADO_SIGLA } from "@/lib/grados";
import { COMPANIA_OPTIONS } from "./options";

const SELECT_CLS =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm";
const INPUT_CLS =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm w-full";

export default async function CadetesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ compania?: string; inactivos?: string; q?: string }>;
}) {
  const params = await searchParams;
  const companiaFiltro = params.compania ?? "";
  const verInactivos = params.inactivos === "1";
  const busqueda = (params.q ?? "").trim();

  const supabase = createAdminClient();
  let query = supabase
    .from("cadetes")
    .select("id, nombre, grado, compania, seccion, activo")
    .order("compania", { ascending: true })
    .order("seccion", { ascending: true })
    .order("grado", { ascending: false })
    .order("nombre", { ascending: true });

  if (companiaFiltro) query = query.eq("compania", companiaFiltro);
  if (!verInactivos) query = query.eq("activo", true);
  if (busqueda) query = query.ilike("nombre", `%${busqueda}%`);

  const { data: cadetes } = await query;
  const lista = cadetes ?? [];

  // Agrupar por compañía → sección
  const porCompania = new Map<string, Map<string, typeof lista>>();
  for (const c of lista) {
    if (!porCompania.has(c.compania)) porCompania.set(c.compania, new Map());
    const secMap = porCompania.get(c.compania)!;
    const seccion = c.seccion ?? "Sin sección";
    const g = secMap.get(seccion) ?? [];
    g.push(c);
    secMap.set(seccion, g);
  }

  // Abrir automáticamente si hay búsqueda o solo una compañía
  const autoOpen = !!busqueda || !!companiaFiltro;

  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/comandante/admin"
              className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700"
            >
              ← Admin
            </Link>
            <h1 className="text-base font-bold text-neutral-900">Cadetes</h1>
          </div>
          <Link
            href="/comandante/admin/cadetes/nuevo"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
          >
            + Agregar
          </Link>
        </div>

        {/* Filtros */}
        <form method="GET" className="mt-3 space-y-2">
          <input
            type="search"
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por apellidos o nombre..."
            className={INPUT_CLS}
            autoComplete="off"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select name="compania" defaultValue={companiaFiltro} className={SELECT_CLS}>
              <option value="">Todas las compañías</option>
              {COMPANIA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-sm text-neutral-600">
              <input
                type="checkbox"
                name="inactivos"
                value="1"
                defaultChecked={verInactivos}
              />
              Ver dados de baja
            </label>
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Buscar
            </button>
          </div>
        </form>
      </header>

      <div className="mx-4 mt-4 space-y-3">
        {lista.length === 0 && (
          <p className="text-center text-sm text-neutral-500 mt-8">
            No hay cadetes con estos filtros.
          </p>
        )}

        {[...porCompania.entries()].map(([compania, secMap]) => {
          const totalCia = [...secMap.values()].reduce((s, arr) => s + arr.length, 0);
          return (
            <details
              key={compania}
              open={autoOpen}
              className="rounded-2xl bg-white shadow overflow-hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between bg-neutral-800 px-4 py-3">
                <span className="text-sm font-bold uppercase tracking-wide text-white">
                  {compania}
                </span>
                <span className="text-xs font-normal text-neutral-400">
                  {totalCia} cadetes
                </span>
              </summary>

              {[...secMap.entries()].map(([seccion, cadetesSecc]) => (
                <div key={seccion} className="border-t border-neutral-100">
                  <p className="bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase text-neutral-500">
                    {seccion} — {cadetesSecc.length}
                  </p>
                  <ul className="divide-y divide-neutral-100">
                    {cadetesSecc.map((c) => (
                      <li
                        key={c.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          !c.activo ? "opacity-40" : ""
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {GRADO_SIGLA[c.grado] ?? c.grado} {c.nombre}
                          </p>
                          {!c.activo && (
                            <p className="text-xs text-red-500">Dado de baja</p>
                          )}
                        </div>
                        <Link
                          href={`/comandante/admin/cadetes/${c.id}`}
                          className="shrink-0 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700"
                        >
                          Editar
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          );
        })}
      </div>
    </main>
  );
}
