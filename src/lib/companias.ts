// Estado Mayor y las Escoltas no tienen sub-secciones (1ra/2da/3ra) como las
// compañías normales: son un solo grupo. Usamos "GENERAL" como su única
// sección para poder reusar toda la lógica de partes/consolidado/historial
// sin volver nullable la columna `seccion` (que es NOT NULL en `partes`).
export const SECCION_UNICA = "GENERAL";

export const COMPANIAS_UNA_SECCION = [
  "ESTADO MAYOR",
  "ESCOLTA DE BANDERA",
  "ESCOLTA DE BANDERA HISTORICA",
] as const;

export const ORDEN_COMPANIAS = [
  ...COMPANIAS_UNA_SECCION,
  "PRIMERA COMPAÑIA",
  "SEGUNDA COMPAÑIA",
  "TERCERA COMPAÑIA",
  "CUARTA COMPAÑIA",
] as const;

export function esCompaniaSinSecciones(compania: string) {
  return (COMPANIAS_UNA_SECCION as readonly string[]).includes(compania);
}
