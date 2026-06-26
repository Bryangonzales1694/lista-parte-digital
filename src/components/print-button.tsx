"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-100 active:scale-90 print:hidden"
    >
      Guardar PDF / Imprimir
    </button>
  );
}
