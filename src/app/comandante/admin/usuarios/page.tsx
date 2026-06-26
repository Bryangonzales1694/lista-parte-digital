export const dynamic = "force-dynamic";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const ROL_LABEL: Record<string, string> = {
  compania: "Jefe de Compañía",
  seccion: "Jefe de Sección",
};

const ORDEN_COMPANIA: Record<string, number> = {
  "PRIMERA COMPAÑIA": 1,
  "SEGUNDA COMPAÑIA": 2,
  "TERCERA COMPAÑIA": 3,
  "CUARTA COMPAÑIA": 4,
};

const ORDEN_SECCION: Record<string, number> = {
  "PRIMERA SECCION": 1,
  "SEGUNDA SECCION": 2,
  "TERCERA SECCION": 3,
};

function sortUsuarios<T extends { compania_asignada: string | null; seccion_asignada: string | null }>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const ca = ORDEN_COMPANIA[a.compania_asignada ?? ""] ?? 99;
    const cb = ORDEN_COMPANIA[b.compania_asignada ?? ""] ?? 99;
    if (ca !== cb) return ca - cb;
    const sa = ORDEN_SECCION[a.seccion_asignada ?? ""] ?? 99;
    const sb = ORDEN_SECCION[b.seccion_asignada ?? ""] ?? 99;
    return sa - sb;
  });
}

export default async function UsuariosAdminPage() {
  const supabase = createAdminClient();
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, username, nombre, rol, compania_asignada, seccion_asignada")
    .neq("rol", "comandante");

  const lista = usuarios ?? [];

  // Agrupar por rol (compania primero, luego seccion)
  const porRol = new Map<string, typeof lista>();
  for (const u of lista) {
    const g = porRol.get(u.rol) ?? [];
    g.push(u);
    porRol.set(u.rol, g);
  }

  // Ordenar cada grupo
  for (const [rol, users] of porRol) {
    porRol.set(rol, sortUsuarios(users));
  }

  // Mostrar compania antes que seccion
  const rolesOrdenados = ["compania", "seccion"].filter((r) => porRol.has(r));

  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <Link
            href="/comandante/admin"
            className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700"
          >
            ← Admin
          </Link>
          <h1 className="text-base font-bold text-neutral-900">Usuarios</h1>
        </div>
      </header>

      <div className="mx-4 mt-4 space-y-4">
        {rolesOrdenados.map((rol) => {
          const users = porRol.get(rol)!;
          return (
            <div key={rol} className="rounded-2xl bg-white shadow overflow-hidden">
              <div className="bg-neutral-800 px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-wide text-white">
                  {ROL_LABEL[rol] ?? rol}
                </p>
              </div>
              <ul className="divide-y divide-neutral-100">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {u.username}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {u.compania_asignada ?? "—"}
                        {u.seccion_asignada ? ` · ${u.seccion_asignada}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/comandante/admin/usuarios/${u.id}`}
                      className="shrink-0 rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700"
                    >
                      Contraseña
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  );
}
