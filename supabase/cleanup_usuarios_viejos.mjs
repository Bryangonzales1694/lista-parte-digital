import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://devsupabase.bryangonzales.net";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MTUwNTA4MDAsCiAgImV4cCI6IDE4NzI4MTcyMDAKfQ.WofeW2n8TrG0O0VuGHTSELGgo9wD_8lMKfkqFySIQiA";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: "lista_parte" },
  auth: { persistSession: false },
});

// Usuarios válidos que deben quedarse
const USUARIOS_VALIDOS = [
  "primeraseccion1","primeraseccion2","primeraseccion3",
  "segundaseccion1","segundaseccion2","segundaseccion3",
  "terceraseccion1","terceraseccion2","terceraseccion3",
  "cuartaseccion1","cuartaseccion2","cuartaseccion3",
  "primeracompañia","segundacompañia","terceracompañia","cuartacompañia",
  "comandante",
];

async function main() {
  const { data: todos, error } = await supabase
    .from("usuarios")
    .select("id, username, rol");

  if (error) { console.error("Error:", error.message); process.exit(1); }

  const aEliminar = todos.filter((u) => !USUARIOS_VALIDOS.includes(u.username));

  if (aEliminar.length === 0) {
    console.log("No hay usuarios duplicados/viejos. Todo limpio.");
    return;
  }

  console.log("Usuarios a eliminar:");
  for (const u of aEliminar) console.log(" -", u.username, `(${u.rol})`);

  const ids = aEliminar.map((u) => u.id);

  // Desvincular referencias en partes y registros_parte antes de eliminar
  const { error: e1 } = await supabase
    .from("partes")
    .update({ creado_por: null })
    .in("creado_por", ids);
  if (e1) console.warn("Aviso partes.creado_por:", e1.message);

  const { error: e2 } = await supabase
    .from("registros_parte")
    .update({ registrado_por: null })
    .in("registrado_por", ids);
  if (e2) console.warn("Aviso registros_parte.registrado_por:", e2.message);

  const { error: delError } = await supabase.from("usuarios").delete().in("id", ids);

  if (delError) { console.error("Error al eliminar:", delError.message); process.exit(1); }

  console.log(`\n✓ ${aEliminar.length} usuario(s) eliminado(s).`);
}

main().catch(console.error);
