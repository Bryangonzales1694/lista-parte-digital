export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth/current-user";
import { getConsolidadoBatallon } from "@/lib/consolidado";
import { getConvocatoriaActual } from "@/lib/convocatorias";
import { logout } from "@/app/login/actions";
import { AutoRefresh } from "@/components/auto-refresh";
import { ConvocatoriaControl } from "@/components/convocatoria-control";
import { ESTADOS, ESTADO_LABEL, ESTADO_COLOR } from "@/lib/estados";
import { GRADO_SIGLA } from "@/lib/grados";

export default async function ComandantePage() {
  const session = await getSession();
  if (!session) return null; // el proxy ya protege esta ruta

  const convocatoria = await getConvocatoriaActual();

  const { companias, totalCadetes, totalConteoPorEstado } =
    await getConsolidadoBatallon(convocatoria?.id ?? null);

  const totalSecciones = companias.reduce((acc, c) => acc + c.secciones.length, 0);
  const seccionesReportadas = companias.reduce(
    (acc, c) => acc + c.secciones.filter((s) => s.parteEnviado).length,
    0
  );

  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <AutoRefresh seconds={20} />

      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-neutral-900">
              Batallón — Consolidado General
            </h1>
            <p className="text-sm text-neutral-500">{session.nombre}</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/historial"
              className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium"
            >
              Historial
            </a>
            <a
              href="/comandante/admin"
              className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium"
            >
              Admin
            </a>
            <a
              href="/comandante/perfil"
              className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium"
            >
              Clave
            </a>
            <form action={logout}>
              <button className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <ConvocatoriaControl convocatoria={convocatoria} />

      <section className="m-4 rounded-2xl bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-neutral-700">
          Total batallón — {totalCadetes} cadetes
          {convocatoria && (
            <span className="ml-2 text-xs font-normal text-neutral-500">
              {convocatoria.etiqueta}: {seccionesReportadas}/{totalSecciones} secciones
              reportaron
            </span>
          )}
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ESTADOS.map((estado) => (
            <div
              key={estado}
              className={`rounded-lg px-2 py-3 text-center ${ESTADO_COLOR[estado]}`}
            >
              <div className="text-lg font-bold">{totalConteoPorEstado[estado]}</div>
              <div className="text-[10px] leading-tight">{ESTADO_LABEL[estado]}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-4 space-y-3">
        {companias.map((comp) => (
          <details key={comp.compania} className="rounded-2xl bg-white p-4 shadow">
            <summary className="flex cursor-pointer items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900">
                {comp.compania} — {comp.totalCadetes} cadetes
              </span>
              <span className="text-xs font-medium text-neutral-500">
                {comp.conteoPorEstado.presente} presentes
              </span>
            </summary>

            <div className="mt-3 space-y-3">
              {comp.secciones.map((s) => (
                <details key={s.seccion} className="rounded-xl bg-neutral-50 p-3">
                  <summary className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm font-medium text-neutral-800">
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

                  <ul className="mt-2 divide-y divide-neutral-200">
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
          </details>
        ))}
      </div>
    </main>
  );
}
