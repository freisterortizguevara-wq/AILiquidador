'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface Empresa {
  id: number;
  nit: string;
  nombre: string;
  created_at: string;
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({ nit: '', nombre: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);

  const cargarEmpresas = async () => {
    setCargandoLista(true);
    try {
      const res = await fetch('/api/empresas');
      const data = await res.json();
      if (data.success) setEmpresas(data.empresas);
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setExito(false);

    try {
      const res = await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear empresa');

      setExito(true);
      setFormData({ nit: '', nombre: '' });
      await cargarEmpresas();

      setTimeout(() => {
        setMostrarFormulario(false);
        setExito(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      <div className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        {/* ============ ENCABEZADO ============ */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-16 animate-fade-in-up">
          <div>
            <h1 className="text-[42px] sm:text-[52px] font-semibold tracking-[-0.03em] leading-[1.05] mb-3 text-gray-900 dark:text-white">
              Empresas
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/60 font-light tracking-tight">
              Administra las empresas clientes del sistema.
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="btn-shimmer group flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-full font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex-shrink-0"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            Nueva empresa
          </button>
        </div>

        {/* ============ LISTA ============ */}
        {cargandoLista ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-500 dark:text-white/60 font-light">
              Cargando empresas...
            </p>
          </div>
        ) : empresas.length === 0 ? (
          <div className="text-center py-32 animate-fade-in-up">
            <div className="glass-premium border-iris rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-8">
              <Building2
                className="w-10 h-10 text-gray-400 dark:text-white/40"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
              Aún no hay empresas
            </h3>
            <p className="text-gray-500 dark:text-white/60 font-light mb-8 max-w-md mx-auto">
              Registra tu primera empresa para comenzar a gestionar incapacidades.
            </p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm group"
            >
              Registrar empresa
              <span className="group-hover:translate-x-1 transition-transform duration-300">
                →
              </span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {empresas.map((emp, idx) => (
              <div
                key={emp.id}
                className="glass-premium border-iris group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="relative">
                    {/* Halo pulsante detrás del icono */}
                    <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Building2
                        className="w-6 h-6 text-white"
                        strokeWidth={2}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 tracking-wide uppercase">
                    ID #{emp.id}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-1 tracking-tight">
                  {emp.nombre}
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-white/60 font-mono tracking-tight">
                  NIT {emp.nit}
                </p>

                {/* Línea decorativa al fondo */}
                <div className="mt-5 pt-4 border-t border-gray-200 dark:border-white/[0.08] flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 dark:text-white/40 font-light">
                    Empresa cliente
                  </span>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Ver detalles →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ MODAL ============ */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md animate-fade-in-up">
          <div
            className="absolute inset-0"
            onClick={() => !cargando && setMostrarFormulario(false)}
          />

          <div className="relative glass-strong border border-white/10 dark:border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up overflow-hidden">
            {/* Línea luminosa superior */}
            <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

            {/* Botón cerrar */}
            <button
              onClick={() => !cargando && setMostrarFormulario(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] flex items-center justify-center transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-white/60" />
            </button>

            {!exito ? (
              <>
                {/* Encabezado del modal */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-5">
                    <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-2xl animate-pulse-glow" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                      <Building2
                        className="w-8 h-8 text-white"
                        strokeWidth={2}
                      />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight mb-1.5">
                    Nueva empresa
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-white/60 font-light">
                    Ingresa los datos de la empresa cliente.
                  </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2.5">
                      Nombre de la empresa
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      required
                      autoFocus
                      placeholder="Ej: Empresa Demo S.A.S"
                      className="w-full bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all duration-300 text-[15px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2.5">
                      NIT
                    </label>
                    <input
                      type="text"
                      value={formData.nit}
                      onChange={(e) =>
                        setFormData({ ...formData, nit: e.target.value })
                      }
                      required
                      placeholder="Ej: 900.123.456-1"
                      className="w-full bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all duration-300 text-[15px] font-mono"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-2xl text-sm backdrop-blur-sm animate-shake">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={cargando}
                    className="btn-shimmer w-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-medium text-[15px] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 mt-6"
                  >
                    {cargando ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </span>
                    ) : (
                      'Registrar empresa'
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Estado de éxito */
              <div className="text-center py-8">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-emerald-500/40 blur-2xl rounded-full animate-ping-slow" />
                  <div className="relative w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center animate-pop-in">
                    <Check
                      className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
                  Empresa registrada
                </h2>
                <p className="text-sm text-gray-500 dark:text-white/60 font-light">
                  Los datos se han guardado correctamente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}