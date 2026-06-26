"use client";

import { useMemo, useState } from "react";
import { logout } from "@/app/login/actions";
import { ESTADOS, ESTADO_LABEL, ESTADO_COLOR, type Estado } from "@/lib/estados";
import { GRADO_SIGLA } from "@/lib/grados";
import { AutoRefresh } from "@/components/auto-refresh";

type Cadete = { id: string; nombre: string; grado: string };
type RegistroState = { estado: Estado; observacion: string };

function buildRegistrosIniciales(
  cadetes: Cadete[],
  previos?: Record<string, { estado: Estado; observacion: string }>
): Record<string, RegistroState> {
  return Object.fromEntries(
    cadetes.map((c) => [
      c.id,
      previos?.[c.id] ?? { estado: "presente" as Estado, observacion: "" },
    ])
  );
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SeccionForm({
  jefeNombre,
  compania,
  seccion,
  cadetes,
  etiquetaConvocatoria,
  registrosIniciales,
  horaParteEnviado,
}: {
  jefeNombre: string;
  compania: string;
  seccion: string;
  cadetes: Cadete[];
  etiquetaConvocatoria: string | null;
  registrosIniciales?: Record<string, { estado: Estado; observacion: string }>;
  horaParteEnviado?: string | null;
}) {
  const yaEnviado = Boolean(registrosIniciales && horaParteEnviado);

  const [registros, setRegistros] = useState<Record<string, RegistroState>>(() =>
    buildRegistrosIniciales(cadetes, registrosIniciales)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modoCorreccion, setModoCorreccion] = useState(false);
  const [result, setResult] = useState<
    { ok: true; hora: string; esCorreccion: boolean } | { ok: false; error: string } | null
  >(yaEnviado && horaParteEnviado ? { ok: true, hora: fmtHora(horaParteEnviado), esCorreccion: false } : null);

  const totalNoPresentes = useMemo(
    () => Object.values(registros).filter((r) => r.estado !== "presente").length,
    [registros]
  );

  const parteConfirmado = result?.ok === true && !modoCorreccion;
  const enModoEdicion = !parteConfirmado;

  function setEstado(cadeteId: string, estado: Estado) {
    setRegistros((prev) => ({ ...prev, [cadeteId]: { ...prev[cadeteId], estado } }));
    setExpandedId(null);
  }

  function setObservacion(cadeteId: string, observacion: string) {
    setRegistros((prev) => ({ ...prev, [cadeteId]: { ...prev[cadeteId], observacion } }));
  }

  function iniciarCorreccion() {
    setModoCorreccion(true);
    setResult(null);
  }

  async function enviarParte() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/partes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registros: cadetes.map((c) => ({
            cadete_id: c.id,
            estado: registros[c.id].estado,
            observacion: registros[c.id].observacion || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: data.error ?? "Error desconocido" });
      } else {
        const hora = new Date(data.fechaHora).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setModoCorreccion(false);
        setResult({ ok: true, hora, esCorreccion: yaEnviado });
      }
    } catch {
      setResult({ ok: false, error: "No se pudo conectar al servidor" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 pb-28">
      {!parteConfirmado && <AutoRefresh seconds={15} />}

      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-neutral-900">
              {compania} — {seccion}
            </h1>
            <p className="text-sm text-neutral-500">{jefeNombre}</p>
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
        <p className="mt-1 text-sm text-neutral-600">
          {cadetes.length} cadetes · {totalNoPresentes} con condición distinta a Presente
        </p>
        {etiquetaConvocatoria ? (
          <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
            Lista y Parte activa: {etiquetaConvocatoria}
          </p>
        ) : (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Esperando que el comandante active el parte. Puedes preparar las
            condiciones, pero no podrás enviar hasta que se active.
          </p>
        )}
      </header>

      <ul className="divide-y divide-neutral-200 bg-white">
        {cadetes.map((cadete, idx) => {
          const reg = registros[cadete.id];
          const expanded = expandedId === cadete.id;
          return (
            <li key={cadete.id} className="px-4 py-3">
              <button
                type="button"
                onClick={() =>
                  enModoEdicion ? setExpandedId(expanded ? null : cadete.id) : undefined
                }
                disabled={!enModoEdicion}
                className="flex w-full items-center justify-between gap-3 text-left disabled:cursor-default"
              >
                <span className="flex-1">
                  <span className="block text-sm font-medium text-neutral-900">
                    {idx + 1}. {GRADO_SIGLA[cadete.grado] ?? cadete.grado} {cadete.nombre}
                  </span>
                  {reg.observacion && (
                    <span className="block text-xs text-neutral-500">
                      {reg.observacion}
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${ESTADO_COLOR[reg.estado]}`}
                >
                  {ESTADO_LABEL[reg.estado]}
                </span>
              </button>

              {expanded && enModoEdicion && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {ESTADOS.map((estado) => (
                      <button
                        key={estado}
                        type="button"
                        onClick={() => setEstado(cadete.id, estado)}
                        className={`rounded-lg py-3 text-xs font-semibold ${
                          reg.estado === estado
                            ? ESTADO_COLOR[estado]
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {ESTADO_LABEL[estado]}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Observación corta (opcional)"
                    value={reg.observacion}
                    onChange={(e) => setObservacion(cadete.id, e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4">
        {result?.ok === false && (
          <p className="mb-2 text-center text-sm font-medium text-red-600">
            {result.error}
          </p>
        )}

        {parteConfirmado ? (
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold text-green-700">
              {result.esCorreccion
                ? `Parte corregido a las ${result.hora}`
                : `Parte enviado a las ${result.hora}`}
            </p>
            {etiquetaConvocatoria && (
              <button
                type="button"
                onClick={iniciarCorreccion}
                className="w-full rounded-xl border border-neutral-300 py-3 text-sm font-semibold text-neutral-700 active:bg-neutral-50"
              >
                Corregir parte
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={enviarParte}
            disabled={submitting || !etiquetaConvocatoria}
            className="w-full rounded-xl bg-neutral-900 py-4 text-base font-bold text-white active:bg-neutral-700 disabled:opacity-60"
          >
            {submitting
              ? "Enviando..."
              : !etiquetaConvocatoria
                ? "Sin convocatoria activa"
                : modoCorreccion
                  ? "Guardar corrección"
                  : "Enviar Parte"}
          </button>
        )}
      </div>
    </main>
  );
}
