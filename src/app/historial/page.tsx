export const dynamic = "force-dynamic";
import Link from "next/link";
import { getSession } from "@/lib/auth/current-user";
import { getPartesPorFecha, getHistorialComandante } from "@/lib/historial";
import type { HistorialConvocatoria, ParteHistorial } from "@/lib/historial";
import { logout } from "@/app/login/actions";
import { ESTADO_LABEL, ESTADO_COLOR } from "@/lib/estados";
import { GRADO_SIGLA } from "@/lib/grados";

function fechaHoyPeru() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(
    new Date()
  );
}

function primerDiaMesPeru() {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
  return hoy.slice(0, 7) + "-01"; // "YYYY-MM-01"
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ListaCadetes({ registros }: { registros: ParteHistorial["registros"] }) {
  return (
    <ul className="mt-2 divide-y divide-neutral-100">
      {registros.map((r, idx) => (
        <li key={r.cadeteId} className="flex items-center justify-between gap-3 py-2">
          <span className="text-sm text-neutral-800">
            {idx + 1}. {GRADO_SIGLA[r.grado] ?? r.grado} {r.nombre}
            {r.observacion && (
              <span className="block text-xs text-neutral-500">{r.observacion}</span>
            )}
          </span>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLOR[r.estado]}`}>
            {ESTADO_LABEL[r.estado]}
          </span>
        </li>
      ))}
    </ul>
  );
}

function VistaComandante({ convocatorias }: { convocatorias: HistorialConvocatoria[] }) {
  if (convocatorias.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-500">
        No hay partes registrados en esta fecha.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {convocatorias.map((conv) => {
        const companias = [...new Set(conv.partes.map((p) => p.compania))].sort();
        return (
          <details key={conv.convocatoriaId} className="rounded-2xl bg-white shadow" open>
            <summary className="flex cursor-pointer items-center justify-between px-4 py-4">
              <div>
                <p className="text-base font-bold text-neutral-900">{conv.etiqueta}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(conv.abiertaEn).toLocaleDateString("es-PE", {
                    timeZone: "America/Lima",
                    day: "2-digit",
                    month: "short",
                  })}{" "}
                  · Iniciada {fmtHora(conv.abiertaEn)}
                  {conv.cerradaEn ? ` · Cerrada ${fmtHora(conv.cerradaEn)}` : " · Abierta"}
                  {" · "}{conv.partes.length} sección{conv.partes.length !== 1 ? "es" : ""} reportaron
                </p>
              </div>
            </summary>

            <div className="border-t border-neutral-100 px-4 pb-4 pt-2 space-y-2">
              <div className="flex justify-end">
                <a
                  href={`/comandante/imprimir/${conv.convocatoriaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Exportar PDF
                </a>
              </div>
              {companias.length === 0 && (
                <p className="text-sm text-neutral-400">Sin secciones reportadas.</p>
              )}
              {companias.map((compania) => {
                const partesCompania = conv.partes.filter((p) => p.compania === compania);
                return (
                  <details key={compania} className="rounded-xl bg-neutral-50 px-3 py-2">
                    <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
                      {compania}
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        ({partesCompania.length}/3 secciones)
                      </span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {partesCompania.map((parte) => (
                        <details key={parte.id} className="rounded-lg bg-white px-3 py-2 shadow-sm">
                          <summary className="flex cursor-pointer items-center justify-between">
                            <span className="text-sm font-medium text-neutral-700">
                              {parte.seccion}
                            </span>
                            <span className="text-xs text-neutral-400">{fmtHora(parte.fechaHora)}</span>
                          </summary>
                          <ListaCadetes registros={parte.registros} />
                        </details>
                      ))}
                    </div>
                  </details>
                );
              })}
            </div> {/* fin div exportar+companias */}
          </details>
        );
      })}
    </div>
  );
}

function VistaSeccionCompania({ partes }: { partes: ParteHistorial[] }) {
  if (partes.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-500">
        No hay partes registrados en esta fecha.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {partes.map((parte) => (
        <details key={parte.id} className="rounded-2xl bg-white p-4 shadow">
          <summary className="flex cursor-pointer items-center justify-between">
            <span className="text-sm font-semibold text-neutral-900">
              {parte.compania} — {parte.seccion}
              {parte.etiquetaConvocatoria && (
                <span className="ml-2 text-xs font-normal text-neutral-500">
                  ({parte.etiquetaConvocatoria})
                </span>
              )}
            </span>
            <span className="text-xs font-medium text-neutral-500">
              {fmtHora(parte.fechaHora)}
            </span>
          </summary>
          <ListaCadetes registros={parte.registros} />
        </details>
      ))}
    </div>
  );
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; desde?: string; hasta?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const esComandante = session.rol === "comandante";
  const hoy = fechaHoyPeru();

  const desde = params.desde || primerDiaMesPeru();
  const hasta = params.hasta || hoy;
  const fecha = params.fecha || hoy;

  const menuHref =
    session.rol === "comandante"
      ? "/comandante"
      : session.rol === "compania"
        ? "/compania"
        : "/seccion";

  const filtro =
    session.rol === "seccion"
      ? { compania: session.companiaAsignada ?? undefined, seccion: session.seccionAsignada ?? undefined }
      : session.rol === "compania"
        ? { compania: session.companiaAsignada ?? undefined }
        : {};

  const [convocatorias, partes] = await Promise.all([
    esComandante ? getHistorialComandante(desde, hasta) : Promise.resolve([]),
    esComandante ? Promise.resolve([]) : getPartesPorFecha(filtro, fecha),
  ]);

  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={menuHref}
              className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700"
            >
              ← Menú
            </Link>
            <h1 className="text-base font-bold text-neutral-900">Historial de Partes</h1>
          </div>
          <form action={logout}>
            <button className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium">
              Salir
            </button>
          </form>
        </div>
        <form method="GET" className="mt-3 flex flex-wrap items-center gap-2">
          {esComandante ? (
            <>
              <input
                type="date"
                name="desde"
                defaultValue={desde}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <span className="text-xs text-neutral-500">hasta</span>
              <input
                type="date"
                name="hasta"
                defaultValue={hasta}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </>
          ) : (
            <input
              type="date"
              name="fecha"
              defaultValue={fecha}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          )}
          <button
            type="submit"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-transform duration-100 active:scale-90"
          >
            Ver
          </button>
        </form>
      </header>

      <div className="mx-4 mt-4">
        {esComandante ? (
          <VistaComandante convocatorias={convocatorias} />
        ) : (
          <VistaSeccionCompania partes={partes} />
        )}
      </div>
    </main>
  );
}
