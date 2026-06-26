import Link from "next/link";
import { createCadete } from "../actions";
import { GRADO_OPTIONS, COMPANIA_OPTIONS, SECCION_OPTIONS } from "../options";

const INPUT_CLS =
  "w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
const SELECT_CLS =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900";
const LABEL_CLS = "block text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1";

export default function NuevoCadetePage() {
  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center gap-2">
          <Link
            href="/comandante/admin/cadetes"
            className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700"
          >
            ← Cadetes
          </Link>
          <h1 className="text-base font-bold text-neutral-900">
            Agregar Cadete
          </h1>
        </div>
      </header>

      <form action={createCadete} className="mx-4 mt-6 space-y-4 rounded-2xl bg-white p-5 shadow">
        <div>
          <label className={LABEL_CLS}>Apellidos y Nombre</label>
          <input
            type="text"
            name="nombre"
            required
            placeholder="APELLIDO APELLIDO Nombre"
            className={INPUT_CLS}
            autoCapitalize="characters"
          />
          <p className="mt-1 text-xs text-neutral-400">
            Se guardará en mayúsculas automáticamente.
          </p>
        </div>

        <div>
          <label className={LABEL_CLS}>Grado</label>
          <select name="grado" required className={SELECT_CLS}>
            <option value="">Seleccionar grado...</option>
            {GRADO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Compañía</label>
          <select name="compania" required className={SELECT_CLS}>
            <option value="">Seleccionar compañía...</option>
            {COMPANIA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>Sección</label>
          <select name="seccion" required className={SELECT_CLS}>
            <option value="">Seleccionar sección...</option>
            {SECCION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white transition-transform duration-100 active:scale-95"
        >
          Guardar cadete
        </button>
      </form>
    </main>
  );
}
