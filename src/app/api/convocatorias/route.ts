import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConvocatoriaActual } from "@/lib/convocatorias";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "comandante") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const etiqueta = String(body?.etiqueta ?? "").trim();
    if (!etiqueta) {
      return NextResponse.json({ error: "Etiqueta requerida" }, { status: 400 });
    }

    const actual = await getConvocatoriaActual();
    if (actual && !actual.cerradaEn) {
      return NextResponse.json(
        { error: "Ya hay una convocatoria abierta" },
        { status: 409 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("convocatorias")
      .insert({ etiqueta, creado_por: session.usuarioId })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("Error en POST /api/convocatorias:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const session = await getSession();
    if (!session || session.rol !== "comandante") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const actual = await getConvocatoriaActual();
    if (!actual || actual.cerradaEn) {
      return NextResponse.json(
        { error: "No hay convocatoria abierta" },
        { status: 409 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("convocatorias")
      .update({ cerrada_en: new Date().toISOString() })
      .eq("id", actual.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en PATCH /api/convocatorias:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 500 }
    );
  }
}
