export const dynamic = "force-dynamic";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConsolidadoBatallon } from "@/lib/consolidado";
import { ESTADOS, ESTADO_LABEL } from "@/lib/estados";
import { GRADO_SIGLA } from "@/lib/grados";
import { PrintButton } from "@/components/print-button";

const ORDEN_GRADO: Record<string, number> = {
  "4to_anio": 0, "3er_anio": 1, "2do_anio": 2, "1er_anio": 3, aspirante: 4,
};

function etiquetaCorta(etiqueta: string): string {
  const lower = etiqueta.toLowerCase();
  if (lower.includes(" am")) return "Am";
  if (lower.includes(" pm")) return "Pm";
  if (lower.includes("extraordinaria")) return "Ext";
  return etiqueta.replace(/\s+/g, "").slice(0, 6);
}

function fechaCorta(iso: string): string {
  const parts = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const rawMonth = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = rawMonth.replace(".", "");
  return `${day}${month.charAt(0).toUpperCase()}${month.slice(1)}${year}`;
}

function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: conv } = await supabase
    .from("convocatorias")
    .select("etiqueta, abierta_en")
    .eq("id", id)
    .single();
  if (!conv) return { title: "Lista y Parte" };
  return { title: `LP ${etiquetaCorta(conv.etiqueta)} - ${fechaCorta(conv.abierta_en)}` };
}

export default async function ImprimirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: conv, error } = await supabase
    .from("convocatorias")
    .select("id, etiqueta, abierta_en, cerrada_en")
    .eq("id", id)
    .single();

  if (error || !conv) return notFound();

  const { companias, totalCadetes, totalConteoPorEstado } =
    await getConsolidadoBatallon(id);

  const generadoEn = new Date().toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {/* Estilos solo para impresión */}
      <style>{`
        @media print {
          @page { margin: 1.5cm; size: A4 portrait; }
          body { font-size: 11pt; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Barra de acción (oculta al imprimir) */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-6 py-3 print:hidden">
        <Link
          href="/historial"
          className="text-sm font-medium text-neutral-500 hover:text-neutral-800"
        >
          ← Historial
        </Link>
        <span className="text-neutral-300">|</span>
        <PrintButton />
      </div>

      {/* Documento PDF */}
      <div className="mx-auto max-w-3xl px-8 py-6 font-sans text-neutral-900 print:px-0 print:py-0">

        {/* Encabezado */}
        <div className="mb-4 border-b-2 border-neutral-900 pb-3 text-center">
          <h1 className="text-xl font-bold uppercase">Batallón Angamos</h1>
          <h2 className="text-lg font-semibold">Lista y Parte — {conv.etiqueta}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {fmtFechaHora(conv.abierta_en)}
            {conv.cerrada_en && ` · Cerrado ${fmtHora(conv.cerrada_en)}`}
          </p>
        </div>

        {/* Resumen batallón */}
        <section className="mb-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">
            Resumen General — {totalCadetes} cadetes
          </h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {[0, 1, 2, 3].map((row) => {
                const pares = ESTADOS.slice(row * 2, row * 2 + 2);
                return (
                  <tr key={row} className="border border-neutral-300">
                    {pares.map((estado) => (
                      <Fragment key={estado}>
                        <td className="border border-neutral-300 px-3 py-1.5 font-medium">
                          {ESTADO_LABEL[estado]}
                        </td>
                        <td className="border border-neutral-300 px-3 py-1.5 text-center font-bold">
                          {totalConteoPorEstado[estado]}
                        </td>
                      </Fragment>
                    ))}
                    {/* Fila impar: rellenar celda vacía */}
                    {pares.length === 1 && (
                      <>
                        <td className="border border-neutral-300 px-3 py-1.5" />
                        <td className="border border-neutral-300 px-3 py-1.5" />
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Por compañía */}
        {companias.map((comp) => {
          const noPresentes = comp.secciones
            .flatMap((s) =>
              s.cadetes
                .filter((c) => c.estado !== "presente" && c.estado !== "sin_registrar")
                .map((c) => ({ ...c, seccion: s.seccion }))
            )
            .sort(
              (a, b) =>
                (ORDEN_GRADO[a.grado] ?? 99) - (ORDEN_GRADO[b.grado] ?? 99) ||
                a.nombre.localeCompare(b.nombre)
            );

          const seccionesConParte = comp.secciones.filter((s) => s.parteEnviado);
          const todasEnviaron = seccionesConParte.length === comp.secciones.length;

          return (
            <section key={comp.compania} className="mb-5">
              <div className="flex items-baseline justify-between border-b border-neutral-400 pb-1">
                <h3 className="text-sm font-bold uppercase">{comp.compania}</h3>
                <span className="text-xs text-neutral-500">
                  {comp.totalCadetes} cadetes ·{" "}
                  {seccionesConParte.length}/{comp.secciones.length} secciones reportaron
                  {!todasEnviaron && " ⚠"}
                </span>
              </div>

              {/* Conteos rápidos por estado (solo los que tienen valor) */}
              <p className="mt-1 text-xs text-neutral-600">
                {ESTADOS.filter((e) => comp.conteoPorEstado[e] > 0)
                  .map((e) => `${ESTADO_LABEL[e]}: ${comp.conteoPorEstado[e]}`)
                  .join(" · ")}
              </p>

              {/* Lista de no-presentes */}
              {noPresentes.length === 0 ? (
                <p className="mt-1 text-xs italic text-neutral-400">
                  {seccionesConParte.length === 0
                    ? "Sin parte recibido."
                    : "Todos presentes."}
                </p>
              ) : (
                <table className="mt-2 w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th className="border border-neutral-200 px-2 py-1 text-left font-semibold">N°</th>
                      <th className="border border-neutral-200 px-2 py-1 text-left font-semibold">Cadete</th>
                      <th className="border border-neutral-200 px-2 py-1 text-left font-semibold">Sección</th>
                      <th className="border border-neutral-200 px-2 py-1 text-left font-semibold">Condición</th>
                      <th className="border border-neutral-200 px-2 py-1 text-left font-semibold">Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {noPresentes.map((c, idx) => (
                      <tr key={c.id} className={idx % 2 === 0 ? "" : "bg-neutral-50"}>
                        <td className="border border-neutral-200 px-2 py-1 text-center">{idx + 1}</td>
                        <td className="border border-neutral-200 px-2 py-1 font-medium">
                          {GRADO_SIGLA[c.grado] ?? c.grado} {c.nombre}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1 text-neutral-500">
                          {c.seccion.replace("PRIMERA SECCION", "1ra").replace("SEGUNDA SECCION", "2da").replace("TERCERA SECCION", "3ra")}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1">
                          {ESTADO_LABEL[c.estado as keyof typeof ESTADO_LABEL]}
                        </td>
                        <td className="border border-neutral-200 px-2 py-1 text-neutral-500">
                          {c.observacion ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}

        {/* Pie */}
        <div className="mt-8 border-t border-neutral-300 pt-3 text-center text-xs text-neutral-400">
          Generado el {generadoEn} · Lista y Parte Digital — Batallón Angamos
        </div>
      </div>
    </>
  );
}
