'use client';
import ResumenEjecutivo from '@/app/components/ResumenEjecutivo';
import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Download,
  FileText,
  Wallet,
  CalendarDays,
  TrendingUp,
  Loader2,
  AlertCircle,
  ChevronsUpDown,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Empresa {
  id: number;
  nit: string;
  nombre: string;
}

interface Incapacidad {
  id: number;
  tipo: string;
  subtipo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  dias_liquidables: number | null;
  monto_liquidado: number | null;
  empleado_nombre: string | null;
  numero_identificacion: string | null;
}

interface Resumen {
  totalIncapacidades: number;
  totalLiquidado: number;
  porTipo: Record<string, { cantidad: number; monto: number }>;
  porEstado: Record<string, { cantidad: number; monto: number }>;
}

/* ------------------------------------------------------------------
   Utilidades
   ------------------------------------------------------------------ */
const COLOR_ESTADO: Record<string, string> = {
  LIQUIDAR: '#34d399',
  PRESCRITA: '#fb7185',
  REVISAR: '#fb923c',
  SIN_RECONOCIMIENTO: '#94a3b8',
};

const NOMBRE_ESTADO: Record<string, string> = {
  LIQUIDAR: 'Liquidar',
  PRESCRITA: 'Prescrita',
  REVISAR: 'Revisar',
  SIN_RECONOCIMIENTO: 'Sin reconocimiento',
};

const NOMBRE_TIPO: Record<string, string> = {
  EG: 'Enfermedad general',
  ARL: 'Accidente o enfermedad laboral',
  LM: 'Licencia de maternidad',
  LP: 'Licencia de paternidad',
};

const estiloPill = (estado: string) => {
  switch (estado) {
    case 'LIQUIDAR':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20';
    case 'PRESCRITA':
      return 'bg-red-500/12 text-red-700 dark:text-red-400 border border-red-500/20';
    case 'REVISAR':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 dark:text-white/60 border border-gray-300/30 dark:border-white/[0.08]';
  }
};

const formatearPeso = (valor: number | null) => {
  if (valor === null || valor === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
};

const compacto = (valor: number) =>
  '$' +
  new Intl.NumberFormat('es-CO', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(valor);

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

/* ------------------------------------------------------------------
   Componentes
   ------------------------------------------------------------------ */
function IconoChevron() {
  return (
    <ChevronsUpDown
      aria-hidden
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40"
      strokeWidth={2}
    />
  );
}

function Kpi({
  icono: Icono,
  gradiente,
  etiqueta,
  valor,
  detalle,
}: {
  icono: LucideIcon;
  gradiente: string;
  etiqueta: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <div className="glass-premium border-iris rounded-2xl p-5 animate-fade-in-up">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl shadow-lg ${gradiente}`}
        >
          <div className="absolute inset-0 blur-md opacity-60 rounded-xl bg-inherit" />
          <Icono className="relative h-4 w-4 text-white" strokeWidth={2.25} />
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60">
          {etiqueta}
        </p>
      </div>
      <p className="truncate text-[26px] font-semibold leading-none tabular-nums tracking-tight text-gray-900 dark:text-white">
        {valor}
      </p>
      {detalle && (
        <p className="mt-2 text-[12px] text-gray-400 dark:text-white/40 font-light">
          {detalle}
        </p>
      )}
    </div>
  );
}

function Panel({
  titulo,
  descripcion,
  className = '',
  children,
}: {
  titulo: string;
  descripcion?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`glass-premium rounded-2xl p-6 ${className}`}>
      <div className="mb-5">
        <h3 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          {titulo}
        </h3>
        {descripcion && (
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-white/60 font-light">
            {descripcion}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

interface PuntoMes {
  clave: string;
  mes: string;
  anio: string;
  monto: number;
  cantidad: number;
}

function GraficoMensual({ datos }: { datos: PuntoMes[] }) {
  const max = Math.max(...datos.map((d) => d.monto), 1);

  return (
    <div
      role="img"
      aria-label={`Monto liquidado por mes: ${datos
        .map((d) => `${d.mes} ${d.anio}, ${compacto(d.monto)}`)
        .join('; ')}`}
      className="flex"
    >
      <div className="relative h-52 w-14 flex-shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-white/40">
        {[0, 50, 100].map((p) => (
          <span
            key={p}
            style={{ top: `${p}%` }}
            className="absolute right-3 -translate-y-1/2"
          >
            {compacto(max * (1 - p / 100))}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative h-52">
          {[0, 50, 100].map((p) => (
            <div
              key={p}
              style={{ top: `${p}%` }}
              className="absolute inset-x-0 border-t border-gray-200 dark:border-white/[0.08]"
            />
          ))}

          <div className="absolute inset-0 flex items-end gap-2 px-1">
            {datos.map((d) => {
              const alto = d.monto > 0 ? Math.max((d.monto / max) * 100, 1.5) : 0;
              return (
                <div
                  key={d.clave}
                  className="group relative flex h-full flex-1 items-end justify-center"
                  title={`${d.mes} ${d.anio}: ${formatearPeso(d.monto)} (${d.cantidad} incapacidad${d.cantidad !== 1 ? 'es' : ''})`}
                >
                  <div
                    style={{ height: `${alto}%` }}
                    className="w-full max-w-[44px] rounded-t-lg bg-gradient-to-b from-blue-400 to-blue-600 transition-all duration-500 group-hover:from-blue-300 group-hover:to-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/40"
                  />
                  <div
                    style={{ bottom: `calc(${alto}% + 8px)` }}
                    className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-white px-2.5 py-1 text-[11px] font-medium tabular-nums text-white dark:text-gray-900 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100"
                  >
                    {compacto(d.monto)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex gap-2 px-1">
          {datos.map((d) => (
            <div key={d.clave} className="min-w-0 flex-1 text-center leading-tight">
              <p className="truncate text-[12px] font-medium capitalize text-gray-500 dark:text-white/60">
                {d.mes}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-white/40">
                ’{d.anio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Dona({
  segmentos,
  total,
}: {
  segmentos: { estado: string; cantidad: number; monto: number }[];
  total: number;
}) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const hueco = segmentos.length > 1 ? 3 : 0;
  let acumulado = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="13"
            className="stroke-gray-200 dark:stroke-white/[0.08]"
          />
          {segmentos.map((s) => {
            const fraccion = s.cantidad / total;
            const largo = Math.max(fraccion * C - hueco, 0);
            const desplazamiento = -acumulado;
            acumulado += fraccion * C;
            return (
              <circle
                key={s.estado}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                strokeWidth="13"
                stroke={COLOR_ESTADO[s.estado] || '#94a3b8'}
                strokeDasharray={`${largo} ${C - largo}`}
                strokeDashoffset={desplazamiento}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[32px] font-semibold leading-none tabular-nums tracking-tight text-gray-900 dark:text-white">
            {total}
          </p>
          <p className="mt-1 text-[12px] text-gray-500 dark:text-white/60 font-light">
            incapacidad{total !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {segmentos.map((s) => (
          <li key={s.estado} className="flex items-center gap-2.5 text-[14px]">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ background: COLOR_ESTADO[s.estado] || '#94a3b8' }}
            />
            <span className="flex-1 font-medium text-gray-900 dark:text-white">
              {NOMBRE_ESTADO[s.estado] || s.estado}
            </span>
            <span className="tabular-nums text-gray-400 dark:text-white/40">
              {s.cantidad} ({Math.round((s.cantidad / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarrasHorizontales({
  filas,
}: {
  filas: {
    clave: string;
    titulo: string;
    detalle?: string;
    valor: number;
    texto: string;
    avatar?: string;
  }[];
}) {
  const max = Math.max(...filas.map((f) => f.valor), 1);

  return (
    <ul className="space-y-4">
      {filas.map((f) => (
        <li key={f.clave}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {f.avatar && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white shadow-md shadow-blue-500/20">
                  {f.avatar}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-gray-900 dark:text-white">
                  {f.titulo}
                </p>
                {f.detalle && (
                  <p className="truncate text-[12px] text-gray-400 dark:text-white/40 font-light">
                    {f.detalle}
                  </p>
                )}
              </div>
            </div>
            <p className="flex-shrink-0 text-[13px] font-semibold tabular-nums text-gray-900 dark:text-white">
              {f.texto}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/[0.08]">
            <div
              style={{
                width: `${Math.max((f.valor / max) * 100, f.valor > 0 ? 2 : 0)}%`,
              }}
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-sm shadow-blue-500/30 transition-all duration-700"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Esqueleto() {
  return (
    <div
      aria-busy="true"
      aria-label="Generando reporte"
      className="animate-pulse space-y-6"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-premium rounded-2xl h-[116px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-premium rounded-2xl h-80 lg:col-span-2" />
        <div className="glass-premium rounded-2xl h-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-premium rounded-2xl h-64" />
        <div className="glass-premium rounded-2xl h-64" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Página principal
   ------------------------------------------------------------------ */
export default function ReportesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [data, setData] = useState<{
    empresa: Empresa;
    resumen: Resumen;
    incapacidades: Incapacidad[];
    periodo: { desde: string | null; hasta: string | null };
  } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/empresas')
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setEmpresas(d.empresas);
          if (d.empresas.length > 0) setEmpresaId(String(d.empresas[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const generarReporte = async () => {
    if (!empresaId) return;
    setCargando(true);
    setError(null);
    setData(null);

    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.set('fecha_desde', fechaDesde);
      if (fechaHasta) params.set('fecha_hasta', fechaHasta);

      const res = await fetch(
        `/api/reportes/empresa/${empresaId}?${params.toString()}`
      );
      const d = await res.json();

      if (!res.ok) throw new Error(d.error || 'Error al generar reporte');
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  const exportarExcel = () => {
    if (!data) return;

    const workbook = XLSX.utils.book_new();

    const resumenData = [
      ['REPORTE DE INCAPACIDADES'],
      ['Empresa', data.empresa.nombre],
      ['NIT', data.empresa.nit],
      [
        'Período',
        data.periodo.desde && data.periodo.hasta
          ? `${data.periodo.desde} a ${data.periodo.hasta}`
          : 'Todos los registros',
      ],
      [],
      ['Total incapacidades', data.resumen.totalIncapacidades],
      ['Total liquidado', data.resumen.totalLiquidado],
      [],
      ['SUBTOTALES POR TIPO'],
      ['Tipo', 'Cantidad', 'Monto liquidado'],
    ];

    for (const [tipo, valores] of Object.entries(data.resumen.porTipo)) {
      resumenData.push([tipo, valores.cantidad, valores.monto]);
    }

    resumenData.push([]);
    resumenData.push(['SUBTOTALES POR ESTADO']);
    resumenData.push(['Estado', 'Cantidad', 'Monto']);

    for (const [estado, valores] of Object.entries(data.resumen.porEstado)) {
      resumenData.push([estado, valores.cantidad, valores.monto]);
    }

    const hojaResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, hojaResumen, 'Resumen');

    const detalleData = [
      [
        'ID',
        'Empleado',
        'Identificación',
        'Tipo',
        'Subtipo',
        'Fecha inicio',
        'Fecha fin',
        'Días',
        'Días liquidables',
        'Estado',
        'Monto liquidado',
      ],
    ];

    for (const inc of data.incapacidades) {
      detalleData.push([
        inc.id,
        inc.empleado_nombre || '',
        inc.numero_identificacion || '',
        inc.tipo,
        inc.subtipo,
        inc.fecha_inicio,
        inc.fecha_fin,
        inc.dias,
        inc.dias_liquidables || 0,
        inc.estado,
        inc.monto_liquidado || 0,
      ]);
    }

    const hojaDetalle = XLSX.utils.aoa_to_sheet(detalleData);
    XLSX.utils.book_append_sheet(workbook, hojaDetalle, 'Detalle');

    const nombreArchivo = `Reporte_${data.empresa.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  };

  const panel = useMemo(() => {
    if (!data) return null;

    const liquidadas = data.incapacidades.filter((i) => i.estado === 'LIQUIDAR');
    const diasLiquidables = data.incapacidades.reduce(
      (s, i) => s + Number(i.dias_liquidables || 0),
      0
    );
    const promedio =
      liquidadas.length > 0
        ? Number(data.resumen.totalLiquidado) / liquidadas.length
        : 0;

    const porMes = new Map<string, { monto: number; cantidad: number }>();
    for (const inc of data.incapacidades) {
      if (!/^\d{4}-\d{2}/.test(inc.fecha_inicio)) continue;
      const clave = inc.fecha_inicio.slice(0, 7);
      const actual = porMes.get(clave) ?? { monto: 0, cantidad: 0 };
      actual.cantidad += 1;
      if (inc.estado === 'LIQUIDAR')
        actual.monto += Number(inc.monto_liquidado || 0);
      porMes.set(clave, actual);
    }
    const meses: PuntoMes[] = [...porMes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([clave, v]) => {
        const [anio, mes] = clave.split('-');
        return {
          clave,
          mes: new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString(
            'es-CO',
            { month: 'short' }
          ),
          anio: anio.slice(2),
          monto: v.monto,
          cantidad: v.cantidad,
        };
      });

    const porEmpleado = new Map<
      string,
      { nombre: string; identificacion: string; monto: number; cantidad: number }
    >();
    for (const inc of data.incapacidades) {
      const clave = inc.numero_identificacion || inc.empleado_nombre || 'N/A';
      const actual = porEmpleado.get(clave) ?? {
        nombre: inc.empleado_nombre || 'N/A',
        identificacion: inc.numero_identificacion || 'N/A',
        monto: 0,
        cantidad: 0,
      };
      actual.cantidad += 1;
      if (inc.estado === 'LIQUIDAR')
        actual.monto += Number(inc.monto_liquidado || 0);
      porEmpleado.set(clave, actual);
    }
    const topEmpleados = [...porEmpleado.entries()]
      .sort(([, a], [, b]) => b.monto - a.monto || b.cantidad - a.cantidad)
      .slice(0, 5);

    return {
      liquidadas: liquidadas.length,
      diasLiquidables,
      promedio,
      meses,
      topEmpleados,
    };
  }, [data]);

  const hayDatos = !!data && data.incapacidades.length > 0;

  const segmentosEstado = data
    ? Object.entries(data.resumen.porEstado)
        .filter(([, v]) => v.cantidad > 0)
        .map(([estado, v]) => ({
          estado,
          cantidad: v.cantidad,
          monto: Number(v.monto),
        }))
    : [];
  const totalEstados = segmentosEstado.reduce((s, x) => s + x.cantidad, 0);

  const periodoTexto =
    data?.periodo.desde && data?.periodo.hasta
      ? `${data.periodo.desde} a ${data.periodo.hasta}`
      : 'Todos los registros';

  return (
    <main className="min-h-screen relative">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 relative z-10 sm:px-6 lg:px-8">
        {/* ============ ENCABEZADO ============ */}
        <header className="mb-8 animate-fade-in-up">
          <h1 className="text-[42px] sm:text-[52px] font-semibold leading-[1.05] tracking-[-0.03em] text-gray-900 dark:text-white">
            Reportes por empresa
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-500 dark:text-white/60 font-light tracking-tight">
            Genera el panel de incapacidades tramitadas por empresa y período.
          </p>
        </header>

        {/* ============ FILTROS ============ */}
        <section
          className="glass-premium rounded-2xl mb-8 grid grid-cols-1 items-end gap-4 p-5 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] animate-fade-in-up"
          style={{ animationDelay: '80ms' }}
        >
          <div className="md:col-span-2 lg:col-span-1">
            <label
              htmlFor="empresa"
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60"
            >
              Empresa
            </label>
            <div className="relative">
              <select
                id="empresa"
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] py-3 pl-4 pr-10 text-[14px] text-gray-900 dark:text-white outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/[0.09] focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10"
              >
                <option value="">Selecciona una empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id.toString()} value={emp.id.toString()}>
                    {emp.nombre} — NIT {emp.nit}
                  </option>
                ))}
              </select>
              <IconoChevron />
            </div>
          </div>

          <div>
            <label
              htmlFor="fecha-desde"
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60"
            >
              Fecha desde
            </label>
            <input
              id="fecha-desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] px-4 py-3 text-[14px] text-gray-900 dark:text-white outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/[0.09] focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10"
            />
          </div>

          <div>
            <label
              htmlFor="fecha-hasta"
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60"
            >
              Fecha hasta
            </label>
            <input
              id="fecha-hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] px-4 py-3 text-[14px] text-gray-900 dark:text-white outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/[0.09] focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10"
            />
          </div>

          <div className="flex gap-2 md:col-span-2 lg:col-span-1">
            <button
              onClick={generarReporte}
              disabled={cargando || !empresaId}
              className="btn-shimmer inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 px-5 py-3 text-[14px] font-medium text-white shadow-lg shadow-blue-500/25 outline-none transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {cargando ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
              ) : (
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              )}
              {cargando ? 'Generando…' : 'Generar reporte'}
            </button>

            {data && (
              <button
                onClick={exportarExcel}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] px-5 py-3 text-[14px] font-medium text-gray-900 dark:text-white outline-none transition-all duration-300 hover:bg-gray-200 dark:hover:bg-white/[0.1] hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="h-4 w-4" strokeWidth={2.25} />
                Excel
              </button>
            )}
          </div>
        </section>

        {/* ============ ERROR ============ */}
        {error && (
          <div
            role="alert"
            className="mb-8 flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-[14px] text-red-700 dark:text-red-400 animate-shake"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" strokeWidth={2} />
            <p>
              <span className="font-semibold">
                No se pudo generar el reporte.
              </span>{' '}
              {error}
            </p>
          </div>
        )}

        {/* ============ ESTADO INICIAL ============ */}
        {!data && !cargando && !error && (
          <section className="flex flex-col items-center gap-4 glass-premium rounded-2xl px-6 py-20 text-center animate-fade-in-up">
            <div className="glass-premium border-iris rounded-3xl w-20 h-20 flex items-center justify-center">
              <BarChart3
                className="h-9 w-9 text-gray-400 dark:text-white/40"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Aún no hay un reporte
              </p>
              <p className="mt-1 text-[15px] text-gray-500 dark:text-white/60 font-light">
                Elige una empresa y pulsa «Generar reporte» para ver el panel.
              </p>
            </div>
          </section>
        )}

        {cargando && <Esqueleto />}

        {data && panel && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Encabezado del reporte */}
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <div>
                <h2 className="text-[24px] font-bold tracking-tight text-gray-900 dark:text-white">
                  {data.empresa.nombre}
                </h2>
                <p className="text-[14px] text-gray-500 dark:text-white/60">
                  NIT {data.empresa.nit}
                </p>
              </div>
              <p className="rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] px-3 py-1.5 text-[12px] font-medium text-gray-600 dark:text-white/60">
                Período: {periodoTexto}
              </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi
                icono={FileText}
                gradiente="bg-gradient-to-br from-blue-500 to-blue-600"
                etiqueta="Incapacidades"
                valor={String(data.resumen.totalIncapacidades)}
                detalle={`${panel.liquidadas} para liquidar`}
              />
              <Kpi
                icono={Wallet}
                gradiente="bg-gradient-to-br from-emerald-400 to-emerald-600"
                etiqueta="Total liquidado"
                valor={formatearPeso(data.resumen.totalLiquidado)}
                detalle="Suma de las liquidables"
              />
              <Kpi
                icono={CalendarDays}
                gradiente="bg-gradient-to-br from-orange-400 to-orange-500"
                etiqueta="Días liquidables"
                valor={String(panel.diasLiquidables)}
                detalle="Entre todas las incapacidades"
              />
              <Kpi
                icono={TrendingUp}
                gradiente="bg-gradient-to-br from-purple-500 to-pink-500"
                etiqueta="Promedio"
                valor={formatearPeso(Math.round(panel.promedio))}
                detalle="Monto medio por liquidación"
              />
            </div>

            {!hayDatos ? (
              <section className="flex flex-col items-center gap-2 glass-premium rounded-2xl px-6 py-14 text-center">
                <p className="text-[17px] font-semibold text-gray-900 dark:text-white">
                  Sin incapacidades en este período
                </p>
                <p className="text-[15px] text-gray-500 dark:text-white/60 font-light">
                  Prueba con otro rango de fechas u otra empresa.
                </p>
              </section>
            ) : (
              <>
                {/* Tendencia + estados */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <Panel
                    titulo="Monto liquidado por mes"
                    descripcion="Según la fecha de inicio de cada incapacidad"
                    className="lg:col-span-2"
                  >
                    {panel.meses.length > 0 ? (
                      <GraficoMensual datos={panel.meses} />
                    ) : (
                      <p className="py-16 text-center text-[15px] text-gray-500 dark:text-white/60">
                        No hay fechas suficientes para graficar.
                      </p>
                    )}
                  </Panel>

                  <Panel
                    titulo="Por estado"
                    descripcion="Cantidad de incapacidades"
                  >
                    <Dona segmentos={segmentosEstado} total={totalEstados} />
                  </Panel>
                </div>

                {/* Por tipo + empleados */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel
                    titulo="Por tipo de prestación"
                    descripcion="Monto liquidado y cantidad"
                  >
                    <BarrasHorizontales
                      filas={Object.entries(data.resumen.porTipo).map(
                        ([tipo, v]) => ({
                          clave: tipo,
                          titulo: NOMBRE_TIPO[tipo] || tipo,
                          detalle: `${tipo} · ${v.cantidad} incapacidad${v.cantidad !== 1 ? 'es' : ''}`,
                          valor: Number(v.monto),
                          texto: formatearPeso(Number(v.monto)),
                        })
                      )}
                    />
                  </Panel>

                  <Panel
                    titulo="Empleados con mayor monto"
                    descripcion="Los cinco con más valor liquidado"
                  >
                    <BarrasHorizontales
                      filas={panel.topEmpleados.map(([clave, e]) => ({
                        clave,
                        titulo: e.nombre,
                        detalle: `CC ${e.identificacion} · ${e.cantidad} incapacidad${e.cantidad !== 1 ? 'es' : ''}`,
                        valor: e.monto,
                        texto: formatearPeso(e.monto),
                        avatar: iniciales(e.nombre),
                      }))}
                    />
                  </Panel>
                </div>

                {/* Detalle */}
                <section className="glass-premium rounded-2xl overflow-hidden">
                  <div className="flex items-baseline justify-between gap-3 border-b border-gray-200 dark:border-white/[0.08] px-6 py-4">
                    <h3 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
                      Detalle de incapacidades
                    </h3>
                    <p className="text-[13px] tabular-nums text-gray-500 dark:text-white/60">
                      {data.incapacidades.length} registro
                      {data.incapacidades.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-[14px]">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.03] text-[12px] font-medium uppercase tracking-[0.06em] text-gray-500 dark:text-white/60">
                          <th className="px-6 py-3.5 text-left">ID</th>
                          <th className="px-4 py-3.5 text-left">Empleado</th>
                          <th className="px-4 py-3.5 text-left">Tipo</th>
                          <th className="px-4 py-3.5 text-left">Fechas</th>
                          <th className="px-4 py-3.5 text-right">Días</th>
                          <th className="px-4 py-3.5 text-left">Estado</th>
                          <th className="px-6 py-3.5 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-white/[0.08]">
                        {data.incapacidades.map((inc) => (
                          <tr
                            key={inc.id.toString()}
                            className="transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                          >
                            <td className="px-6 py-4 tabular-nums text-gray-400 dark:text-white/40 font-mono text-[12px]">
                              #{inc.id}
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {inc.empleado_nombre || 'N/A'}
                              </div>
                              <div className="text-[12px] text-gray-400 dark:text-white/40">
                                CC {inc.numero_identificacion || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {inc.tipo}
                              </div>
                              <div className="text-[12px] text-gray-400 dark:text-white/40">
                                {inc.subtipo}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[12px] leading-snug text-gray-500 dark:text-white/60">
                              {formatearFecha(inc.fecha_inicio)}
                              <br />
                              {formatearFecha(inc.fecha_fin)}
                            </td>
                            <td className="px-4 py-4 text-right tabular-nums text-gray-900 dark:text-white">
                              {inc.dias}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${estiloPill(inc.estado)}`}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{
                                    background:
                                      COLOR_ESTADO[inc.estado] || '#94a3b8',
                                  }}
                                />
                                {NOMBRE_ESTADO[inc.estado] || inc.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium tabular-nums text-gray-900 dark:text-white">
                              {formatearPeso(inc.monto_liquidado)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}