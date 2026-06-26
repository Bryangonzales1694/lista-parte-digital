import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { ESTADOS, type Estado } from "@/lib/estados";

const ORDEN_SECCIONES = ["PRIMERA SECCION", "SEGUNDA SECCION", "TERCERA SECCION"];

type CadeteRow = { id: string; nombre: string; grado: string; seccion: string | null };
type RegistroRow = {
  parte_id: string;
  cadete_id: string;
  estado: Estado;
  observacion: string | null;
};

export type SeccionConsolidado = {
  seccion: string;
  totalCadetes: number;
  parteEnviado: boolean;
  horaParte: string | null;
  conteoPorEstado: Record<Estado, number>;
  cadetes: Array<{
    id: string;
    nombre: string;
    grado: string;
    estado: Estado | "sin_registrar";
    observacion: string | null;
  }>;
};

function ordenarSecciones(secciones: string[]) {
  return [...secciones].sort((a, b) => {
    const ia = ORDEN_SECCIONES.indexOf(a);
    const ib = ORDEN_SECCIONES.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function conteoVacio(): Record<Estado, number> {
  return Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<Estado, number>;
}

export async function getConsolidadoCompania(
  compania: string,
  convocatoriaId: string | null
) {
  const supabase = createAdminClient();

  const { data: cadetesData, error: cadetesError } = await supabase
    .from("cadetes")
    .select("id, nombre, grado, seccion")
    .eq("compania", compania)
    .eq("activo", true)
    .not("seccion", "is", null)
    .order("grado", { ascending: false })
    .order("nombre", { ascending: true });

  if (cadetesError) throw new Error(cadetesError.message);
  const cadetes = (cadetesData ?? []) as CadeteRow[];

  const seccionesPresentes = ordenarSecciones([
    ...new Set(cadetes.map((c) => c.seccion!).filter(Boolean)),
  ]);

  let partesData: { id: string; fecha_hora: string; seccion: string }[] = [];
  if (convocatoriaId) {
    const { data, error: partesError } = await supabase
      .from("partes")
      .select("id, fecha_hora, seccion")
      .eq("compania", compania)
      .eq("convocatoria_id", convocatoriaId)
      .order("fecha_hora", { ascending: false });

    if (partesError) throw new Error(partesError.message);
    partesData = data ?? [];
  }

  const ultimoPartePorSeccion = new Map<
    string,
    { id: string; fecha_hora: string }
  >();
  for (const p of partesData) {
    if (!ultimoPartePorSeccion.has(p.seccion)) {
      ultimoPartePorSeccion.set(p.seccion, { id: p.id, fecha_hora: p.fecha_hora });
    }
  }

  const parteIds = [...ultimoPartePorSeccion.values()].map((p) => p.id);
  let registros: RegistroRow[] = [];
  if (parteIds.length > 0) {
    const { data: registrosData, error: registrosError } = await supabase
      .from("registros_parte")
      .select("parte_id, cadete_id, estado, observacion")
      .in("parte_id", parteIds);
    if (registrosError) throw new Error(registrosError.message);
    registros = registrosData ?? [];
  }

  const registroPorCadete = new Map<string, RegistroRow>();
  for (const r of registros) {
    registroPorCadete.set(r.cadete_id, r);
  }

  const secciones: SeccionConsolidado[] = seccionesPresentes.map((seccion) => {
    const cadetesSeccion = cadetes.filter((c) => c.seccion === seccion);
    const ultimoParte = ultimoPartePorSeccion.get(seccion);
    const conteoPorEstado = conteoVacio();

    const cadetesConEstado: SeccionConsolidado["cadetes"] = cadetesSeccion.map(
      (c) => {
        const registro = registroPorCadete.get(c.id);
        const estado: Estado | "sin_registrar" = registro?.estado ?? "sin_registrar";
        if (registro) conteoPorEstado[registro.estado]++;
        return {
          id: c.id,
          nombre: c.nombre,
          grado: c.grado,
          estado,
          observacion: registro?.observacion ?? null,
        };
      }
    );

    return {
      seccion,
      totalCadetes: cadetesSeccion.length,
      parteEnviado: Boolean(ultimoParte),
      horaParte: ultimoParte?.fecha_hora ?? null,
      conteoPorEstado,
      cadetes: cadetesConEstado,
    };
  });

  const totalConteoPorEstado = conteoVacio();
  let totalCadetes = 0;
  for (const s of secciones) {
    totalCadetes += s.totalCadetes;
    for (const estado of ESTADOS) {
      totalConteoPorEstado[estado] += s.conteoPorEstado[estado];
    }
  }

  return { secciones, totalCadetes, totalConteoPorEstado };
}

const ORDEN_COMPANIAS = [
  "PRIMERA COMPAÑIA",
  "SEGUNDA COMPAÑIA",
  "TERCERA COMPAÑIA",
  "CUARTA COMPAÑIA",
];

export type CompaniaConsolidado = {
  compania: string;
  totalCadetes: number;
  conteoPorEstado: Record<Estado, number>;
  secciones: SeccionConsolidado[];
};

export async function getConsolidadoBatallon(convocatoriaId: string | null) {
  const companias = await Promise.all(
    ORDEN_COMPANIAS.map(async (compania) => {
      const { secciones, totalCadetes, totalConteoPorEstado } =
        await getConsolidadoCompania(compania, convocatoriaId);
      return {
        compania,
        totalCadetes,
        conteoPorEstado: totalConteoPorEstado,
        secciones,
      };
    })
  );

  const totalConteoPorEstado = conteoVacio();
  let totalCadetes = 0;
  for (const c of companias) {
    totalCadetes += c.totalCadetes;
    for (const estado of ESTADOS) {
      totalConteoPorEstado[estado] += c.conteoPorEstado[estado];
    }
  }

  return { companias, totalCadetes, totalConteoPorEstado };
}
