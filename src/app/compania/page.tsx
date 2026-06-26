import { getSession } from "@/lib/auth/current-user";
import { getConsolidadoCompania } from "@/lib/consolidado";
import { getConvocatoriaActual } from "@/lib/convocatorias";
import { logout } from "@/app/login/actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { ESTADO_LABEL, ESTADO_COLOR } from "@/lib/estados";
import { GRADO_SIGLA } from "@/lib/grados";
import { EstadoTiles } from "@/components/estado-tiles";

export default async function CompaniaPage() {
  const session = await getSession();
  if (!session) return null; // el proxy ya protege esta ruta

  const compania = session.companiaAsignada ?? "";
  const convocatoria = await getConvocatoriaActual();
  const { secciones, totalCadetes, totalConteoPorEstado } =
    await getConsolidadoCompania(compania, convocatoria?.id ?? null);

  const cadetesFlat = secciones.flatMap((s) =>
    s.cadetes.map((c) => ({ ...c, seccion: s.seccion }))
  );

  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <AutoRefresh seconds={20} />

      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-neutral-900">{compania}</h1>
            <p className="text-sm text-neutral-500">{session.nombre}</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/historial"
              className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium"
            >
              Historial
            </a>
            <form action={logout}>
              <button className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      {convocatoria && !convocatoria.cerradaEn ? (
        <p className="mx-4 mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
          Lista y Parte activa: {convocatoria.etiqueta}
        </p>
      ) : (
        <p className="mx-4 mt-3 rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700">
          No hay Lista y Parte activa en este momento.
        </p>
      )}

      <section className="m-4 rounded-2xl bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-neutral-700">
          Consolidado de compañía — {totalCadetes} cadetes
        </h2>
        <EstadoTiles
          totalConteoPorEstado={totalConteoPorEstado}
          cadetes={cadetesFlat}
        />
      </section>

      <div className="mx-4 space-y-3">
        {secciones.map((s) => (
          <details
            key={s.seccion}
            className="rounded-2xl bg-white p-4 shadow"
            open={!s.parteEnviado}
          >
            <summary className="flex cursor-pointer items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900">
                {s.seccion} — {s.totalCadetes} cadetes
              </span>
              {s.parteEnviado ? (
                <span className="text-xs font-medium text-green-700">
                  Parte enviado{" "}
                  {new Date(s.horaParte!).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : (
                <span className="text-xs font-medium text-red-600">
                  Sin parte enviado
                </span>
              )}
            </summary>

            <ul className="mt-3 divide-y divide-neutral-100">
              {s.cadetes.map((c, idx) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="text-sm text-neutral-800">
                    {idx + 1}. {GRADO_SIGLA[c.grado] ?? c.grado} {c.nombre}
                    {c.observacion && (
                      <span className="block text-xs text-neutral-500">
                        {c.observacion}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      c.estado === "sin_registrar"
                        ? "bg-neutral-300 text-neutral-700"
                        : ESTADO_COLOR[c.estado]
                    }`}
                  >
                    {c.estado === "sin_registrar"
                      ? "Sin registrar"
                      : ESTADO_LABEL[c.estado]}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </main>
  );
}
