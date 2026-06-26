import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Convocatoria = {
  id: string;
  etiqueta: string;
  abiertaEn: string;
  cerradaEn: string | null;
};

export async function getConvocatoriaActual(): Promise<Convocatoria | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("convocatorias")
    .select("id, etiqueta, abierta_en, cerrada_en")
    .order("abierta_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    etiqueta: data.etiqueta,
    abiertaEn: data.abierta_en,
    cerradaEn: data.cerrada_en,
  };
}
