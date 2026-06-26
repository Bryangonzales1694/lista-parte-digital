/**
 * Crea los 16 usuarios operativos (12 jefes de sección + 4 jefes de compañía).
 * Uso: node supabase/seed_usuarios_reales.mjs
 */
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://devsupabase.bryangonzales.net";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MTUwNTA4MDAsCiAgImV4cCI6IDE4NzI4MTcyMDAKfQ.WofeW2n8TrG0O0VuGHTSELGgo9wD_8lMKfkqFySIQiA";

const PASSWORD_INICIAL = "12345";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  db: { schema: "lista_parte" },
  auth: { persistSession: false },
});

const COMPANIAS = [
  { key: "primera", nombre: "PRIMERA COMPAÑIA",  corto: "1ra" },
  { key: "segunda", nombre: "SEGUNDA COMPAÑIA",  corto: "2da" },
  { key: "tercera", nombre: "TERCERA COMPAÑIA",  corto: "3ra" },
  { key: "cuarta",  nombre: "CUARTA COMPAÑIA",   corto: "4ta" },
];

const SECCIONES = [
  { num: 1, nombre: "PRIMERA SECCION",  corto: "1ra" },
  { num: 2, nombre: "SEGUNDA SECCION",  corto: "2da" },
  { num: 3, nombre: "TERCERA SECCION",  corto: "3ra" },
];

const USERNAMES_VIEJOS = [
  "1ra-s1","1ra-s2","1ra-s3",
  "2da-s1","2da-s2","2da-s3",
  "3ra-s1","3ra-s2","3ra-s3",
  "4ta-s1","4ta-s2","4ta-s3",
  "1ra-cia","2da-cia","3ra-cia","4ta-cia",
];

async function main() {
  // Eliminar usuarios anteriores si existen
  const { error: delError } = await supabase
    .from("usuarios")
    .delete()
    .in("username", USERNAMES_VIEJOS);
  if (delError) console.warn("Limpieza previa:", delError.message);

  console.log("Generando hash de contraseña...");
  const hash = await bcrypt.hash(PASSWORD_INICIAL, 10);

  const usuarios = [];

  for (const cia of COMPANIAS) {
    for (const sec of SECCIONES) {
      usuarios.push({
        username: `${cia.key}seccion${sec.num}`,
        nombre: `Jefe ${sec.corto} Sección - ${cia.corto} Cía.`,
        rol: "seccion",
        seccion_asignada: sec.nombre,
        compania_asignada: cia.nombre,
        password_hash: hash,
      });
    }
  }

  for (const cia of COMPANIAS) {
    usuarios.push({
      username: `${cia.key}compañia`,
      nombre: `Jefe ${cia.corto} Compañía`,
      rol: "compania",
      seccion_asignada: null,
      compania_asignada: cia.nombre,
      password_hash: hash,
    });
  }

  console.log(`Insertando ${usuarios.length} usuarios...`);

  const { data, error } = await supabase
    .from("usuarios")
    .insert(usuarios)
    .select("username, rol, compania_asignada, seccion_asignada");

  if (error) {
    console.error("Error al insertar:", error.message);
    process.exit(1);
  }

  console.log("\n✓ Usuarios creados exitosamente:\n");
  console.log("USERNAME               ROL        COMPAÑIA               SECCIÓN");
  console.log("─".repeat(75));
  for (const u of data) {
    console.log(
      `${u.username.padEnd(23)}${u.rol.padEnd(11)}${(u.compania_asignada ?? "—").padEnd(23)}${u.seccion_asignada ?? "—"}`
    );
  }
  console.log("\n  Contraseña inicial para todos:", PASSWORD_INICIAL);
}

main().catch(console.error);
