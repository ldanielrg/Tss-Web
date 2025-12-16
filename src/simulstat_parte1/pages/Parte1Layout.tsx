import { Link, Outlet } from "react-router-dom";

export default function Parte1Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Parte 1</h1>
            <p className="text-sm text-gray-500">
              Ejemplos/Problemas (versión web)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-3 py-2 rounded bg-gray-900 text-white text-sm hover:opacity-90"
            >
              Volver a Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-600">
          Ruta: <code>/simulstat/parte1</code>
        </div>
      </footer>
    </div>
  );
}
