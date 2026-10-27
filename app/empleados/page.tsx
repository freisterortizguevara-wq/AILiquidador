'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Users,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  X,
  Search,
  Building2,
  IdCard,
  Calendar,
} from 'lucide-react';

interface Empresa {
  id: number;
  nit: string;
  nombre: string;
}

interface Empleado {
  id: number;
  empresa_id: number;
  numero_identificacion: string;
  nombre: string;
  ibc: number | null;
  fecha_ingreso: string | null;
}

export default function EmpleadosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    empresa_id: '',
    numero_identificacion: '',
    nombre: '',
    ibc: '',
    fecha_ingreso: '',
  });
  const [cargando, setCargando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    fetch('/api/empresas')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.empresas.length > 0) {
          setEmpresas(data.empresas);
          setFormData((prev) => ({
            ...prev,
            empresa_id: String(data.empresas[0].id),
          }));
        }
      });
  }, []);

  const cargarEmpleados = async () => {
    setCargandoLista(true);
    try {
      const params = new URLSearchParams();
      if (filtroEmpresa) params.set('empresa_id', filtroEmpresa);
      const res = await fetch(`/api/empleados?${params.toString()}`);
      const data = await res.json();
      if (data.success) setEmpleados(data.empleados);
    } finally {
      setCargandoLista(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, [filtroEmpresa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setExito(false);

    try {
      const res = await fetch('/api/empleados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: Number(formData.empresa_id),
          numero_identificacion: formData.numero_identificacion,
          nombre: formData.nombre,
          ibc: formData.ibc ? Number(formData.ibc) : undefined,
          fecha_ingreso: formData.fecha_ingreso || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear empleado');

      setExito(true);
      setFormData((prev) => ({
        ...prev,
        numero_identificacion: '',
        nombre: '',
        ibc: '',
        fecha_ingreso: '',
      }));
      await cargarEmpleados();

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

  const formatearPeso = (valor: number | null) => {
    if (!valor) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const empleadosFiltrados = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.numero_identificacion.includes(busqueda)
  );

  const getNombreEmpresa = (empresa_id: number) =>
    empresas.find((e) => e.id === empresa_id)?.nombre || 'Empresa desconocida';

  return (
    <main className="min-h-screen relative">
      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        {/* ============ ENCABEZADO ============ */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12 animate-fade-in-up">
          <div>
            <h1 className="text-[42px] sm:text-[52px] font-semibold tracking-[-0.03em] leading-[1.05] mb-3 text-gray-900 dark:text-white">
              Empleados
            </h1>
            <p className="text-lg text-gray-500 dark:text-white/60 font-light tracking-tight">
              Registra y administra los empleados de cada empresa.
            </p>
          </div>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="btn-shimmer group flex items-center justify-center gap-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-full font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex-shrink-0"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            Nuevo empleado
          </button>
        </div>

        {/* ============ FILTROS ============ */}
        <div
          className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full glass-premium rounded-2xl pl-11 pr-5 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300"
            />
          </div>

          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="glass-premium rounded-2xl px-5 py-3 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 cursor-pointer"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>

          <div className="flex items-center px-5 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-sm text-blue-700 dark:text-blue-400 font-medium">
            <Users className="w-4 h-4 mr-2" />
            {empleadosFiltrados.length} empleado
            {empleadosFiltrados.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ============ LISTA ============ */}
        {cargandoLista ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-500 dark:text-white/60 font-light">
              Cargando empleados...
            </p>
          </div>
        ) : empleadosFiltrados.length === 0 ? (
          <div className="text-center py-32 animate-fade-in-up">
            <div className="glass-premium border-iris rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-8">
              <Users
                className="w-10 h-10 text-gray-400 dark:text-white/40"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
              {busqueda || filtroEmpresa
                ? 'Sin resultados'
                : 'Aún no hay empleados'}
            </h3>
            <p className="text-gray-500 dark:text-white/60 font-light mb-8 max-w-md mx-auto">
              {busqueda || filtroEmpresa
                ? 'Prueba con otros filtros de búsqueda.'
                : 'Registra tu primer empleado para comenzar.'}
            </p>
            {!busqueda && !filtroEmpresa && (
              <button
                onClick={() => setMostrarFormulario(true)}
                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm group"
              >
                Registrar empleado
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {empleadosFiltrados.map((emp, idx) => (
              <div
                key={emp.id}
                className="glass-premium border-iris group rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Avatar + ID */}
                <div className="flex items-start justify-between mb-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <span className="text-white font-bold text-base tracking-tight">
                        {emp.nombre
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 tracking-wide uppercase">
                    ID #{emp.id}
                  </span>
                </div>

                {/* Nombre + Cédula */}
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-1 tracking-tight">
                  {emp.nombre}
                </h3>
                <p className="text-[12px] text-gray-500 dark:text-white/60 font-mono tracking-tight mb-4">
                  CC {emp.numero_identificacion}
                </p>

                {/* Info */}
                <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-white/[0.08]">
                  <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-white/60">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {getNombreEmpresa(emp.empresa_id)}
                    </span>
                  </div>
                  {emp.ibc && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-400 dark:text-white/40">
                        IBC
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatearPeso(emp.ibc)}
                      </span>
                    </div>
                  )}
                  {emp.fecha_ingreso && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-400 dark:text-white/40 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        Ingreso
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(emp.fecha_ingreso).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  )}
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

          <div className="relative glass-strong border border-white/10 dark:border-white/[0.08] rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-fade-in-up max-h-[90vh] overflow-y-auto">
            {/* Línea luminosa superior */}
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

            <button
              onClick={() => !cargando && setMostrarFormulario(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] flex items-center justify-center transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-white/60" />
            </button>

            {!exito ? (
              <>
                {/* Encabezado */}
                <div className="text-center mb-8">
                  <div className="relative inline-block mb-5">
                    <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-2xl animate-pulse-glow" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30">
                      <User className="w-8 h-8 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight mb-1.5">
                    Nuevo empleado
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-white/60 font-light">
                    Ingresa los datos del empleado.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2.5">
                      Empresa
                    </label>
                    <select
                      value={formData.empresa_id}
                      onChange={(e) =>
                        setFormData({ ...formData, empresa_id: e.target.value })
                      }
                      required
                      className="w-full bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all duration-300 text-[15px]"
                    >
                      <option value="">Selecciona una empresa</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre} — NIT {emp.nit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2.5">
                      Número de identificación
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40 pointer-events-none" />
                      <input
                        type="text"
                        value={formData.numero_identificacion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numero_identificacion: e.target.value,
                          })
                        }
                        required
                        placeholder="Ej: 1234567890"
                        className="w-full bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] rounded-2xl pl-11 pr-5 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all duration-300 text-[15px] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2.5">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      required
                      autoFocus
                      placeholder="Ej: Juan Carlos Pérez"
                      className="w-full bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all duration-300 text-[15px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2.5">
                      IBC (Ingreso Base de Cotización)
                    </label>
                    <input
                      type="number"
                      value={formData.ibc}
                      onChange={(e) =>
                        setFormData({ ...formData, ibc: e.target.value })
                      }
                      placeholder="Ej: 2500000"
                      className="w-full bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all duration-300 text-[15px]"
                    />
                    <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2 font-light">
                      Se usa para liquidar prórrogas y licencias.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-white/60 uppercase tracking-[0.08em] mb-2.5">
                      Fecha de ingreso
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_ingreso}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_ingreso: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] rounded-2xl px-5 py-4 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 outline-none transition-all duration-300 text-[15px]"
                    />
                    <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2 font-light">
                      Necesaria para validar relación laboral (regla de 59 días).
                    </p>
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
                      'Registrar empleado'
                    )}
                  </button>
                </form>
              </>
            ) : (
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
                  Empleado registrado
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