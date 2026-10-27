'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronsUpDown,
  FileSearch,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  FileText,
} from 'lucide-react';

interface Empresa {
  id: number;
  nit: string;
  nombre: string;
}

interface Incapacidad {
  id: number;
  empresa_id: number;
  empleado_id: number;
  empresa_nombre: string | null;
  empleado_nombre: string | null;
  tipo: string;
  subtipo: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  ibc: number | null;
  diagnostico_cie10: string | null;
  estado: string;
  dias_liquidables: number | null;
  monto_liquidado: number | null;
  formula: string | null;
  pdf_url: string | null; // ← NUEVO CAMPO
  created_at: string;
}

export default function IncapacidadesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [incapacidades, setIncapacidades] = useState<Incapacidad[]>([]);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/empresas')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setEmpresas(data.empresas);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(null);

    const params = new URLSearchParams();
    if (filtroEmpresa) params.set('empresa_id', filtroEmpresa);
    if (filtroEstado) params.set('estado', filtroEstado);

    fetch(`/api/incapacidades?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIncapacidades(data.incapacidades);
        } else {
          setError(data.error || 'Error al cargar incapacidades');
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [filtroEmpresa, filtroEstado]);

  const formatearPeso = (valor: number | null) => {
    if (valor === null || valor === undefined) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const estiloEstado = (estado: string) => {
    switch (estado) {
      case 'LIQUIDAR':
        return {
          etiqueta: 'Liquidar',
          icono: CheckCircle2,
          pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
          iconoColor: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'PRESCRITA':
        return {
          etiqueta: 'Prescrita',
          icono: XCircle,
          pill: 'bg-red-500/12 text-red-700 dark:text-red-400 border border-red-500/20',
          iconoColor: 'text-red-600 dark:text-red-400',
        };
      case 'REVISAR':
        return {
          etiqueta: 'Revisar',
          icono: AlertTriangle,
          pill: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/20',
          iconoColor: 'text-orange-600 dark:text-orange-400',
        };
      case 'SIN_RECONOCIMIENTO':
        return {
          etiqueta: 'Sin reconocimiento',
          icono: Ban,
          pill: 'bg-gray-500/10 text-gray-600 dark:text-white/60 border border-gray-300/30 dark:border-white/[0.08]',
          iconoColor: 'text-gray-500 dark:text-white/50',
        };
      default:
        return {
          etiqueta: estado,
          icono: Clock,
          pill: 'bg-gray-500/10 text-gray-600 dark:text-white/60 border border-gray-300/30 dark:border-white/[0.08]',
          iconoColor: 'text-gray-500 dark:text-white/50',
        };
    }
  };

  const totalLiquidado = incapacidades
    .filter((i) => i.estado === 'LIQUIDAR')
    .reduce((sum, i) => sum + Number(i.monto_liquidado || 0), 0);

  return (
    <main className="min-h-screen relative">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 relative z-10 sm:px-8">
        {/* ============ ENCABEZADO ============ */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-[42px] sm:text-[52px] font-semibold leading-[1.05] tracking-[-0.03em] text-gray-900 dark:text-white">
              Historial de incapacidades
            </h1>
            <p className="mt-3 text-lg text-gray-500 dark:text-white/60 font-light tracking-tight">
              {incapacidades.length} incapacidad
              {incapacidades.length !== 1 ? 'es' : ''} registrada
              {incapacidades.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/liquidar"
            className="btn-shimmer group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
            Nueva liquidación
          </Link>
        </header>

        {/* ============ FILTROS ============ */}
        <section
          className="glass-premium rounded-2xl mb-6 grid grid-cols-1 gap-4 p-5 md:grid-cols-3 animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          <div>
            <label
              htmlFor="filtro-empresa"
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60"
            >
              Empresa
            </label>
            <div className="relative">
              <select
                id="filtro-empresa"
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] py-3 pl-4 pr-10 text-[14px] text-gray-900 dark:text-white outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/[0.09] focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10"
              >
                <option value="">Todas las empresas</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
              <ChevronsUpDown
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40"
                strokeWidth={2}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filtro-estado"
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60"
            >
              Estado
            </label>
            <div className="relative">
              <select
                id="filtro-estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] py-3 pl-4 pr-10 text-[14px] text-gray-900 dark:text-white outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/[0.09] focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10"
              >
                <option value="">Todos los estados</option>
                <option value="LIQUIDAR">Liquidar</option>
                <option value="PRESCRITA">Prescrita</option>
                <option value="SIN_RECONOCIMIENTO">Sin reconocimiento</option>
                <option value="REVISAR">Revisar</option>
              </select>
              <ChevronsUpDown
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40"
                strokeWidth={2}
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 dark:border-blue-400/30 px-5 py-3">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">
                    Total liquidado
                  </p>
                  <p className="text-xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white mt-0.5">
                    {formatearPeso(totalLiquidado)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ ERROR ============ */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-[14px] text-red-700 dark:text-red-400 animate-shake"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" strokeWidth={2} />
            <p>
              <span className="font-semibold">No se pudo cargar el historial.</span>{' '}
              {error}
            </p>
          </div>
        )}

        {/* ============ TABLA ============ */}
        <section
          className="glass-premium rounded-2xl overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '160ms' }}
        >
          {cargando ? (
            <div
              aria-busy="true"
              aria-label="Cargando incapacidades"
              className="divide-y divide-gray-200 dark:divide-white/[0.08]"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-6 px-5 py-4"
                >
                  <div className="h-3 w-10 rounded-full bg-gray-200 dark:bg-white/[0.08]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/3 rounded-full bg-gray-200 dark:bg-white/[0.08]" />
                    <div className="h-3 w-1/4 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
                  </div>
                  <div className="hidden h-6 w-24 rounded-full bg-gray-200 dark:bg-white/[0.08] sm:block" />
                  <div className="h-3.5 w-20 rounded-full bg-gray-200 dark:bg-white/[0.08]" />
                </div>
              ))}
            </div>
          ) : incapacidades.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
              <div className="glass-premium border-iris rounded-3xl w-20 h-20 flex items-center justify-center">
                <FileSearch
                  className="h-9 w-9 text-gray-400 dark:text-white/40"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  Sin incapacidades
                </p>
                <p className="mt-1 text-[15px] text-gray-500 dark:text-white/60 font-light max-w-md">
                  {filtroEmpresa || filtroEstado
                    ? 'Ninguna coincide con los filtros. Prueba con otra empresa o estado.'
                    : 'Cuando liquides una incapacidad, aparecerá aquí.'}
                </p>
              </div>
              {!filtroEmpresa && !filtroEstado && (
                <Link
                  href="/liquidar"
                  className="mt-2 inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm group"
                >
                  Crear nueva liquidación
                  <span className="group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-[14px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.03] text-[12px] font-medium uppercase tracking-[0.06em] text-gray-500 dark:text-white/60">
                    <th className="px-5 py-3.5 text-left">ID</th>
                    <th className="px-5 py-3.5 text-left">Empleado</th>
                    <th className="px-5 py-3.5 text-left">Tipo</th>
                    <th className="px-5 py-3.5 text-left">Fechas</th>
                    <th className="px-5 py-3.5 text-right">Días</th>
                    <th className="px-5 py-3.5 text-left">Estado</th>
                    <th className="px-5 py-3.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/[0.08]">
                  {incapacidades.map((inc) => {
                    const estilo = estiloEstado(inc.estado);
                    const Icono = estilo.icono;
                    return (
                      <tr
                        key={inc.id}
                        className="transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <td className="px-5 py-4 tabular-nums text-gray-400 dark:text-white/40 font-mono text-[12px]">
                          #{inc.id}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {inc.empleado_nombre || 'N/A'}
                          </div>
                          <div className="text-[12px] text-gray-400 dark:text-white/40">
                            {inc.empresa_nombre || 'N/A'}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {inc.tipo}
                          </div>
                          <div className="text-[12px] text-gray-400 dark:text-white/40">
                            {inc.subtipo}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[12px] leading-snug text-gray-500 dark:text-white/60">
                          {formatearFecha(inc.fecha_inicio)}
                          <br />
                          {formatearFecha(inc.fecha_fin)}
                        </td>
                        <td className="px-5 py-4 text-right tabular-nums text-gray-900 dark:text-white">
                          {inc.dias}
                          {inc.dias_liquidables !== null &&
                            inc.dias_liquidables !== inc.dias && (
                              <span
                                title="Días liquidables"
                                className="text-gray-400 dark:text-white/40 ml-1"
                              >
                                ({inc.dias_liquidables})
                              </span>
                            )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide ${estilo.pill}`}
                          >
                            <Icono
                              className={`h-3 w-3 ${estilo.iconoColor}`}
                              strokeWidth={2.5}
                            />
                            {estilo.etiqueta}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-medium tabular-nums text-gray-900 dark:text-white">
                              {formatearPeso(inc.monto_liquidado)}
                            </span>
                            {inc.pdf_url && (
                              <a
                                href={`/api/incapacidades/pdf/ver?url=${encodeURIComponent(inc.pdf_url)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                title="Ver PDF original"
                              >
                                📎 PDF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}