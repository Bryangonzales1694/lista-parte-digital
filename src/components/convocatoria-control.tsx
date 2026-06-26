"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Convocatoria } from "@/lib/convocatorias";

const ETIQUETAS_RAPIDAS = ["Formación AM", "Formación PM", "Extraordinaria"];

export function ConvocatoriaControl({
  convocatoria,
}: {
  convocatoria: Convocatoria | null;
}) {
  const router = useRouter();
  const [pendingEtiqueta, setPendingEtiqueta] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etiquetaPersonalizada, setEtiquetaPersonalizada] = useState("");

  const abierta = convocatoria && !convocatoria.cerradaEn ? convocatoria : null;

  async function activar(etiqueta: string) {
    if (!etiqueta.trim()) return;
    setPendingEtiqueta(etiqueta);
    setError(null);
    const res = await fetch("/api/convocatorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etiqueta: etiqueta.trim() }),
    });
    const data = await res.json();
    setPendingEtiqueta(null);
    if (!res.ok) {
      setError(data.error ?? "Error activando convocatoria");
      return;
    }
    router.refresh();
  }

  async function cerrar() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/convocatorias", { method: "PATCH" });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Error cerrando convocatoria");
      return;
    }
    router.refresh();
  }

  if (abierta) {
    return (
      <section className="m-4 rounded-2xl bg-green-50 p-4 shadow">
        <p className="text-sm font-semibold text-green-800">
          Lista y Parte activa: {abierta.etiqueta}
        </p>
        <p className="text-xs text-green-700">
          Desde las{" "}
          {new Date(abierta.abiertaEn).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <button
          type="button"
          onClick={cerrar}
          disabled={pending}
          className="mt-3 w-full rounded-lg bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Cerrando..." : "Cerrar Lista y Parte"}
        </button>
        {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
      </section>
    );
  }

  return (
    <section className="m-4 rounded-2xl bg-white p-4 shadow">
      <p className="text-sm font-semibold text-neutral-800">
        No hay Lista y Parte activa. Los jefes de sección no pueden enviar parte.
      </p>

      {/* Selector de tipo de formación */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border-2 border-neutral-900 bg-neutral-900 px-3 py-2 text-center">
          <p className="text-xs font-bold text-white">Por Compañía</p>
          <p className="text-[10px] text-neutral-400">Activo</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-neutral-300 px-3 py-2 text-center opacity-50">
          <p className="text-xs font-bold text-neutral-500">Por Año</p>
          <p className="text-[10px] text-neutral-400">Próximamente</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {ETIQUETAS_RAPIDAS.map((etiqueta) => {
          const esEsta = pendingEtiqueta === etiqueta;
          return (
            <button
              key={etiqueta}
              type="button"
              onClick={() => activar(etiqueta)}
              disabled={pendingEtiqueta !== null}
              className={`rounded-lg py-3 text-xs font-semibold text-white disabled:opacity-40 ${
                esEsta ? "bg-blue-600" : "bg-neutral-900"
              }`}
            >
              {esEsta ? "Iniciando..." : etiqueta}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          placeholder="Otra etiqueta..."
          value={etiquetaPersonalizada}
          onChange={(e) => setEtiquetaPersonalizada(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => activar(etiquetaPersonalizada)}
          disabled={pendingEtiqueta !== null || !etiquetaPersonalizada.trim()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pendingEtiqueta === etiquetaPersonalizada ? "Iniciando..." : "Iniciar"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </section>
  );
}
