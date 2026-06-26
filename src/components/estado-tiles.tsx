"use client";

import { useState } from "react";
import { ESTADOS, ESTADO_LABEL, ESTADO_COLOR } from "@/lib/estados";
import { GRADO_SIGLA } from "@/lib/grados";
import type { Estado } from "@/lib/estados";

const ORDEN_GRADO: Record<string, number> = {
  "4to_anio": 0,
  "3er_anio": 1,
  "2do_anio": 2,
  "1er_anio": 3,
  aspirante: 4,
};

export type CadeteFlat = {
  id: string;
  nombre: string;
  grado: string;
  seccion: string;
  estado: Estado | "sin_registrar";
  observacion: string | null;
};

export function EstadoTiles({
  totalConteoPorEstado,
  cadetes,
}: {
  totalConteoPorEstado: Record<Estado, number>;
  cadetes: CadeteFlat[];
}) {
  const [estadoActivo, setEstadoActivo] = useState<Estado | null>(null);

  const cadetesDelEstado = estadoActivo
    ? cadetes
        .filter((c) => c.estado === estadoActivo)
        .sort(
          (a, b) =>
            (ORDEN_GRADO[a.grado] ?? 99) - (ORDEN_GRADO[b.grado] ?? 99) ||
            a.nombre.localeCompare(b.nombre)
        )
    : [];

  function handleTileClick(estado: Estado) {
    if (totalConteoPorEstado[estado] > 0) {
      setEstadoActivo(estado);
    }
  }

  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {ESTADOS.map((estado) => {
          const count = totalConteoPorEstado[estado];
          return (
            <button
              key={estado}
              type="button"
              onClick={() => handleTileClick(estado)}
              disabled={count === 0}
              className={`rounded-lg px-2 py-3 text-center transition-transform duration-100 active:scale-90 disabled:opacity-50 ${ESTADO_COLOR[estado]} ${count > 0 ? "cursor-pointer shadow-sm active:shadow-none" : ""}`}
            >
              <div className="text-lg font-bold">{count}</div>
              <div className="text-[10px] leading-tight">{ESTADO_LABEL[estado]}</div>
            </button>
          );
        })}
      </div>

      {estadoActivo && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setEstadoActivo(null)}
        >
          <div
            className="max-h-[70vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">
                {ESTADO_LABEL[estadoActivo]}{" "}
                <span className="font-normal text-neutral-500">
                  — {cadetesDelEstado.length} cadete{cadetesDelEstado.length !== 1 ? "s" : ""}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setEstadoActivo(null)}
                className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-bold text-neutral-500"
              >
                ✕
              </button>
            </div>

            <ul className="divide-y divide-neutral-100">
              {cadetesDelEstado.map((c, idx) => (
                <li key={c.id} className="py-2">
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-neutral-800">
                      {idx + 1}. {GRADO_SIGLA[c.grado] ?? c.grado} {c.nombre}
                    </span>
                    <span className="ml-2 shrink-0 text-xs text-neutral-400">{c.seccion}</span>
                  </div>
                  {c.observacion && (
                    <span className="block text-xs text-neutral-400">{c.observacion}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
