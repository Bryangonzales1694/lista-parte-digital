export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConvocatoriaActual } from "@/lib/convocatorias";
import { SeccionForm } from "./seccion-form";
import type { Estado } from "@/lib/estados";

export default async function SeccionPage() {
  const session = await getSession();
  if (!session) return null;

  const convocatoria = await getConvocatoriaActual();
  const convocatoriaAbierta =
    convocatoria && !convocatoria.cerradaEn ? convocatoria : null;

  const supabase = createAdminClient();
  const { data: cadetes, error } = await supabase
    .from("cadetes")
    .select("id, nombre, grado")
    .eq("compania", session.companiaAsignada ?? "")
    .eq("seccion", session.seccionAsignada ?? "")
    .eq("activo", true)
    .order("grado", { ascending: false })
    .order("nombre", { ascending: true });

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-600">Error cargando cadetes: {error.message}</p>
      </main>
    );
  }

  // Si hay convocatoria abierta, verificar si ya existe un parte enviado
  let registrosIniciales: Record<string, { estado: Estado; observacion: string }> | undefined;
  let horaParteEnviado: string | null = null;

  if (convocatoriaAbierta) {
    const { data: parteExistente } = await supabase
      .from("partes")
      .select("id, fecha_hora")
      .eq("compania", session.companiaAsignada ?? "")
      .eq("seccion", session.seccionAsignada ?? "")
      .eq("convocatoria_id", convocatoriaAbierta.id)
      .maybeSingle();

    if (parteExistente) {
      horaParteEnviado = parteExistente.fecha_hora;
      const { data: registros } = await supabase
        .from("registros_parte")
        .select("cadete_id, estado, observacion")
        .eq("parte_id", parteExistente.id);

      if (registros) {
        registrosIniciales = Object.fromEntries(
          registros.map((r) => [
            r.cadete_id,
            { estado: r.estado as Estado, observacion: r.observacion ?? "" },
          ])
        );
      }
    }
  }

  return (
    <SeccionForm
      jefeNombre={session.nombre}
      compania={session.companiaAsignada ?? ""}
      seccion={session.seccionAsignada ?? ""}
      cadetes={cadetes ?? []}
      etiquetaConvocatoria={convocatoriaAbierta?.etiqueta ?? null}
      registrosIniciales={registrosIniciales}
      horaParteEnviado={horaParteEnviado}
    />
  );
}
