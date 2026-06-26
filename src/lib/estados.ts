export const ESTADOS = [
  "presente",
  "guardia",
  "comision",
  "otros",
  "internado_sanidad",
  "eerr",
  "clases",
  "cemena",
  "observaciones",
] as const;

export type Estado = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<Estado, string> = {
  presente: "Presente",
  guardia: "Guardia",
  comision: "Comisión",
  otros: "Otros",
  internado_sanidad: "Internado Sanidad",
  eerr: "EERR",
  clases: "Clases",
  cemena: "CEMENA",
  observaciones: "Observaciones",
};

export const ESTADO_COLOR: Record<Estado, string> = {
  presente: "bg-green-600 text-white",
  guardia: "bg-blue-600 text-white",
  comision: "bg-purple-600 text-white",
  otros: "bg-neutral-500 text-white",
  internado_sanidad: "bg-red-600 text-white",
  eerr: "bg-orange-500 text-white",
  clases: "bg-amber-500 text-white",
  cemena: "bg-teal-600 text-white",
  observaciones: "bg-yellow-600 text-white",
};
