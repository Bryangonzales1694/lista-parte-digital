import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Estado } from "@/lib/estados";

export type HistorialConvocatoria = {
  convocatoriaId: string;
  etiqueta: string;
  abiertaEn: string;
  cerradaEn: string | null;
  partes: ParteHistorial[];
};

type RegistroEmbed = {
  cadete_id: string;
  estado: Estado;
  observacion: string | null;
  cadetes: { nombre: string; grado: string } | null;
};

export type ParteHistorial = {
  id: string;
  fechaHora: string;
  compania: string;
  seccion: string;
  etiquetaConvocatoria: string | null;
  registros: Array<{
    cadeteId: string;
    nombre: string;
    grado: string;
    estado: Estado;
    observacion: string | null;
  }>;
};

const PERU_OFFSET = "-05:00";

const ORDEN_GRADO: Record<string, number> = {
  "4to_anio": 0,
  "3er_anio": 1,
  "2do_anio": 2,
  "1er_anio": 3,
  aspirante: 4,
};

function sortRegistros<T extends { grado: string; nombre: string }>(regs: T[]): T[] {
  return [...regs].sort(
    (a, b) =>
      (ORDEN_GRADO[a.grado] ?? 99) - (ORDEN_GRADO[b.grado] ?? 99) ||
      a.nombre.localeCompare(b.nombre)
  );
}

function mapRegistros(regs: RegistroEmbed[]): ParteHistorial["registros"] {
  return sortRegistros(
    regs.map((r) => ({
      cadeteId: r.cadete_id,
      nombre: r.cadetes?.nombre ?? "",
      grado: r.cadetes?.grado ?? "",
      estado: r.estado,
      observacion: r.observacion,
    }))
  );
}

export async function getPartesPorFecha(
  filtro: { compania?: string; seccion?: string },
  fecha: string
): Promise<ParteHistorial[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("partes")
    .select("id, fecha_hora, compania, seccion, convocatorias(etiqueta)")
    .gte("fecha_hora", `${fecha}T00:00:00${PERU_OFFSET}`)
    .lte("fecha_hora", `${fecha}T23:59:59.999${PERU_OFFSET}`)
    .order("fecha_hora", { ascending: false });

  if (filtro.compania) query = query.eq("compania", filtro.compania);
  if (filtro.seccion) query = query.eq("seccion", filtro.seccion);

  const { data: partes, error } = await query;
  if (error) throw new Error(error.message);
  if (!partes || partes.length === 0) return [];

  const parteIds = partes.map((p) => p.id);
  const { data: registros, error: regError } = await supabase
    .from("registros_parte")
    .select("parte_id, cadete_id, estado, observacion, cadetes(nombre, grado)")
    .in("parte_id", parteIds);
  if (regError) throw new Error(regError.message);

  const registrosPorParte = new Map<string, RegistroEmbed[]>();
  for (const r of (registros ?? []) as unknown as (RegistroEmbed & { parte_id: string })[]) {
    const lista = registrosPorParte.get(r.parte_id) ?? [];
    lista.push(r);
    registrosPorParte.set(r.parte_id, lista);
  }

  return partes.map((p) => {
    const convocatoria = p.convocatorias as unknown as { etiqueta: string } | null;
    return {
      id: p.id,
      fechaHora: p.fecha_hora,
      compania: p.compania,
      seccion: p.seccion,
      etiquetaConvocatoria: convocatoria?.etiqueta ?? null,
      registros: mapRegistros(registrosPorParte.get(p.id) ?? []),
    };
  });
}

// desde/hasta: "YYYY-MM-DD"
export async function getHistorialComandante(
  desde: string,
  hasta: string
): Promise<HistorialConvocatoria[]> {
  const supabase = createAdminClient();

  const { data: convocatorias, error: convError } = await supabase
    .from("convocatorias")
    .select("id, etiqueta, abierta_en, cerrada_en")
    .gte("abierta_en", `${desde}T00:00:00${PERU_OFFSET}`)
    .lte("abierta_en", `${hasta}T23:59:59.999${PERU_OFFSET}`)
    .order("abierta_en", { ascending: false });

  if (convError) throw new Error(convError.message);
  if (!convocatorias || convocatorias.length === 0) return [];

  const convIds = convocatorias.map((c) => c.id);

  const { data: partes, error: partesError } = await supabase
    .from("partes")
    .select("id, fecha_hora, compania, seccion, convocatoria_id")
    .in("convocatoria_id", convIds)
    .order("compania", { ascending: true })
    .order("seccion", { ascending: true });

  if (partesError) throw new Error(partesError.message);

  if (!partes || partes.length === 0) {
    return convocatorias.map((c) => ({
      convocatoriaId: c.id,
      etiqueta: c.etiqueta,
      abiertaEn: c.abierta_en,
      cerradaEn: c.cerrada_en,
      partes: [],
    }));
  }

  const parteIds = partes.map((p) => p.id);
  const { data: registros, error: regError } = await supabase
    .from("registros_parte")
    .select("parte_id, cadete_id, estado, observacion, cadetes(nombre, grado)")
    .in("parte_id", parteIds);

  if (regError) throw new Error(regError.message);

  const registrosPorParte = new Map<string, RegistroEmbed[]>();
  for (const r of (registros ?? []) as unknown as (RegistroEmbed & { parte_id: string })[]) {
    const lista = registrosPorParte.get(r.parte_id) ?? [];
    lista.push(r);
    registrosPorParte.set(r.parte_id, lista);
  }

  const partesPorConv = new Map<string, typeof partes>();
  for (const p of partes) {
    if (!p.convocatoria_id) continue;
    const lista = partesPorConv.get(p.convocatoria_id) ?? [];
    lista.push(p);
    partesPorConv.set(p.convocatoria_id, lista);
  }

  return convocatorias.map((c) => ({
    convocatoriaId: c.id,
    etiqueta: c.etiqueta,
    abiertaEn: c.abierta_en,
    cerradaEn: c.cerrada_en,
    partes: (partesPorConv.get(c.id) ?? []).map((p) => ({
      id: p.id,
      fechaHora: p.fecha_hora,
      compania: p.compania,
      seccion: p.seccion,
      etiquetaConvocatoria: c.etiqueta,
      registros: mapRegistros(registrosPorParte.get(p.id) ?? []),
    })),
  }));
}
