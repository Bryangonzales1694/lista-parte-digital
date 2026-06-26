import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-neutral-100 pb-10">
      <header className="bg-white px-4 py-3 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/comandante"
              className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700"
            >
              ← Menú
            </Link>
            <h1 className="text-base font-bold text-neutral-900">
              Panel Administrador
            </h1>
          </div>
          <form action={logout}>
            <button className="rounded-lg bg-neutral-200 px-3 py-2 text-xs font-medium">
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-4 mt-6 space-y-4">
        <Link
          href="/comandante/admin/cadetes"
          className="flex items-center justify-between rounded-2xl bg-white p-5 shadow"
        >
          <div>
            <p className="text-base font-bold text-neutral-900">
              Gestión de Cadetes
            </p>
            <p className="mt-0.5 text-sm text-neutral-500">
              Agregar, editar y dar de baja
            </p>
          </div>
          <span className="text-2xl text-neutral-300">›</span>
        </Link>

        <Link
          href="/comandante/admin/usuarios"
          className="flex items-center justify-between rounded-2xl bg-white p-5 shadow"
        >
          <div>
            <p className="text-base font-bold text-neutral-900">
              Gestión de Usuarios
            </p>
            <p className="mt-0.5 text-sm text-neutral-500">
              Resetear contraseñas
            </p>
          </div>
          <span className="text-2xl text-neutral-300">›</span>
        </Link>
      </div>
    </main>
  );
}
