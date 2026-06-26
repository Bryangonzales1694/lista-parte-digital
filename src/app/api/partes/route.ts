import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { ESTADOS, type Estado } from "@/lib/estados";
import { getConvocatoriaActual } from "@/lib/convocatorias";

type RegistroInput = {
  cadete_id: string;
  estado: Estado;
  observacion: string | null;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.rol !== "seccion") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const registros: RegistroInput[] | undefined = body?.registros;

  if (!Array.isArray(registros) || registros.length === 0) {
    return NextResponse.json({ error: "Sin registros" }, { status: 400 });
  }

  for (const r of registros) {
    if (!r.cadete_id || !ESTADOS.includes(r.estado)) {
      return NextResponse.json({ error: "Registro inválido" }, { status: 400 });
    }
  }

  const convocatoria = await getConvocatoriaActual();
  if (!convocatoria || convocatoria.cerradaEn) {
    return NextResponse.json(
      { error: "No hay una convocatoria de parte abierta en este momento" },
      { status: 409 }
    );
  }

  const supabase = createAdminClient();

  // Si ya existe un parte para esta sección+convocatoria, borrarlo (corrección)
  const { data: parteExistente } = await supabase
    .from("partes")
    .select("id")
    .eq("compania", session.companiaAsignada)
    .eq("seccion", session.seccionAsignada)
    .eq("convocatoria_id", convocatoria.id)
    .maybeSingle();

  if (parteExistente) {
    await supabase.from("registros_parte").delete().eq("parte_id", parteExistente.id);
    await supabase.from("partes").delete().eq("id", parteExistente.id);
  }

  const { data: parte, error: parteError } = await supabase
    .from("partes")
    .insert({
      compania: session.companiaAsignada,
      seccion: session.seccionAsignada,
      creado_por: session.usuarioId,
      convocatoria_id: convocatoria.id,
    })
    .select("id, fecha_hora")
    .single();

  if (parteError || !parte) {
    return NextResponse.json(
      { error: parteError?.message ?? "Error creando parte" },
      { status: 500 }
    );
  }

  const { error: registrosError } = await supabase.from("registros_parte").insert(
    registros.map((r) => ({
      parte_id: parte.id,
      cadete_id: r.cadete_id,
      estado: r.estado,
      observacion: r.observacion || null,
      registrado_por: session.usuarioId,
    }))
  );

  if (registrosError) {
    return NextResponse.json({ error: registrosError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, parteId: parte.id, fechaHora: parte.fecha_hora });
}
