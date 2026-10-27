'use client';

import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Building2,
  FileText,
  Calendar,
  Calculator,
  Upload,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ChevronsUpDown,
  Loader2,
  Sparkles,
  Zap,
  User,
  Files,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------
   Tipos
   ------------------------------------------------------------------ */
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

interface ResultadoLiquidacion {
  estado: 'LIQUIDAR' | 'SIN_RECONOCIMIENTO' | 'PRESCRITA' | 'REVISAR';
  diasLiquidables: number;
  monto: number;
  formula: string;
  smlvAplicado: number;
  observaciones: string[];
}

interface ResultadoAuto {
  incapacidad_id: number;
  empleado: { id: number; nombre: string; ibc: number | null };
  empresa: { id: number; nombre: string; nit: string } | null;
  liquidacion: ResultadoLiquidacion;
  extraccion: {
    numero_identificacion: string | null;
    nombre_empleado: string | null;
    tipo_prestacion: string | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    dias_incapacidad: number | null;
    diagnostico_cie10: string | null;
    eps_o_arl: string | null;
    es_prorroga: boolean | null;
    ibc_declarado: number | null;
  };
}

interface ResultadoLoteItem {
  archivo: string;
  success: boolean;
  incapacidad_id?: number;
  empleado?: { nombre: string; identificacion: string | null };
  liquidacion?: ResultadoLiquidacion;
  error?: string;
}

interface ResultadoLote {
  success: boolean;
  resumen: {
    total: number;
    exitosos: number;
    fallidos: number;
    totalLiquidado: number;
  };
  resultados: ResultadoLoteItem[];
}

/* ------------------------------------------------------------------
   Estilos base
   ------------------------------------------------------------------ */
const CAMPO_BASE =
  'w-full rounded-xl bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.12] px-4 py-3 text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 outline-none transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/[0.09] focus:bg-white dark:focus:bg-white/[0.1] focus:border-blue-500/50 dark:focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 disabled:cursor-not-allowed disabled:opacity-50';

function Campo({
  label,
  htmlFor,
  hint,
  className = '',
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-2 text-[12px] text-orange-600 dark:text-orange-400">{hint}</p>
      )}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={CAMPO_BASE} />;
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${CAMPO_BASE} cursor-pointer appearance-none pr-10`}>
        {children}
      </select>
      <ChevronsUpDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-white/40"
        strokeWidth={2}
      />
    </div>
  );
}

function Seccion({
  icono: Icono,
  gradiente,
  titulo,
  columnas = 'md:grid-cols-2',
  children,
}: {
  icono: LucideIcon;
  gradiente: string;
  titulo: string;
  columnas?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl shadow-lg ${gradiente}`}
        >
          <div className="absolute inset-0 blur-md opacity-60 rounded-xl bg-inherit" />
          <Icono className="relative h-4 w-4 text-white" strokeWidth={2.25} />
        </div>
        <h2 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
          {titulo}
        </h2>
      </div>
      <div className={`grid grid-cols-1 gap-x-4 gap-y-4 ${columnas}`}>
        {children}
      </div>
    </section>
  );
}

const estiloEstado = (estado: string) => {
  switch (estado) {
    case 'LIQUIDAR':
      return {
        etiqueta: 'Liquidar',
        pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
        icono: CheckCircle2,
        iconoColor: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'PRESCRITA':
      return {
        etiqueta: 'Prescrita',
        pill: 'bg-red-500/12 text-red-700 dark:text-red-400 border border-red-500/20',
        icono: AlertCircle,
        iconoColor: 'text-red-600 dark:text-red-400',
      };
    case 'REVISAR':
      return {
        etiqueta: 'Revisar',
        pill: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/20',
        icono: AlertCircle,
        iconoColor: 'text-orange-600 dark:text-orange-400',
      };
    default:
      return {
        etiqueta: estado === 'SIN_RECONOCIMIENTO' ? 'Sin reconocimiento' : estado,
        pill: 'bg-gray-500/10 text-gray-600 dark:text-white/60 border border-gray-300/30 dark:border-white/[0.08]',
        icono: AlertCircle,
        iconoColor: 'text-gray-500 dark:text-white/50',
      };
  }
};

const aTextoNumerico = (valor: number | string | null | undefined) =>
  valor ? String(Number(valor)) : '';

/* ------------------------------------------------------------------
   Página
   ------------------------------------------------------------------ */
export default function LiquidarPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [formData, setFormData] = useState({
    empresa_id: '',
    empleado_id: '',
    tipo: 'EG',
    subtipo: 'NUEVA',
    anio: '2026',
    dias: '',
    ibc: '',
    fechaInicio: '',
    fechaFin: '',
    diagnostico_cie10: '',
  });

  const [resultado, setResultado] = useState<ResultadoLiquidacion | null>(null);
  const [resultadoAuto, setResultadoAuto] = useState<ResultadoAuto | null>(null);
  const [incapacidadGuardada, setIncapacidadGuardada] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [autoProcesando, setAutoProcesando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultadoRef = useRef<HTMLElement>(null);
  const [procesandoPdf, setProcesandoPdf] = useState(false);
  const [mensajePdf, setMensajePdf] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [procesandoLote, setProcesandoLote] = useState(false);
  const [resultadoLote, setResultadoLote] = useState<ResultadoLote | null>(null);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }, []);

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
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!formData.empresa_id) {
      setEmpleados([]);
      return;
    }
    fetch(`/api/empleados?empresa_id=${formData.empresa_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEmpleados(data.empleados);
          if (data.empleados.length > 0) {
            setFormData((prev) => ({
              ...prev,
              empleado_id: String(data.empleados[0].id),
              ibc: aTextoNumerico(data.empleados[0].ibc),
            }));
          } else {
            setFormData((prev) => ({ ...prev, empleado_id: '', ibc: '' }));
          }
        }
      })
      .catch(() => {});
  }, [formData.empresa_id]);

  useEffect(() => {
    const emp = empleados.find((e) => e.id === Number(formData.empleado_id));
    if (emp && emp.ibc) {
      setFormData((prev) => ({ ...prev, ibc: aTextoNumerico(emp.ibc) }));
    }
  }, [formData.empleado_id, empleados]);

  useEffect(() => {
    if (resultado) {
      resultadoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [resultado]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const convertirPdfAImagen = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport, canvas }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return dataUrl.split(',')[1];
  };

  /* ============ SELECCIÓN DE ARCHIVOS ============ */
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const listaArchivos = Array.from(files);
    setPdfFiles(listaArchivos);
    setResultadoAuto(null);
    setResultadoLote(null);
    setError(null);

    if (listaArchivos.length === 1) {
      setPdfFile(listaArchivos[0]);
      procesarUnSoloPdf(listaArchivos[0]);
    } else {
      setPdfFile(null);
      setMensajePdf(
        `📚 ${listaArchivos.length} PDFs seleccionados. Pulsa el botón "Procesar lote" para liquidarlos todos automáticamente.`
      );
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ============ PROCESO UN SOLO PDF (extraer y prellenar) ============ */
  const procesarUnSoloPdf = async (file: File) => {
    setProcesandoPdf(true);
    setMensajePdf(null);
    setError(null);

    try {
      const imageBase64 = await convertirPdfAImagen(file);

      const res = await fetch('/api/ia/procesar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar PDF');

      const d = data.datos;
      setFormData((prev) => ({
        ...prev,
        tipo: d.tipo_prestacion || prev.tipo,
        subtipo: d.es_prorroga ? 'PRORROGA' : 'NUEVA',
        fechaInicio: d.fecha_inicio || prev.fechaInicio,
        fechaFin: d.fecha_fin || prev.fechaFin,
        dias: d.dias_incapacidad ? String(d.dias_incapacidad) : prev.dias,
        ibc: d.ibc_declarado ? aTextoNumerico(d.ibc_declarado) : prev.ibc,
        diagnostico_cie10: d.diagnostico_cie10 || prev.diagnostico_cie10,
      }));

      setMensajePdf(
        `Datos extraídos: ${d.nombre_empleado || 'Empleado'} — ${d.tipo_prestacion || 'Tipo'} (${d.dias_incapacidad || '?'} días). Pulsa el botón verde para liquidar automáticamente.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar PDF');
    } finally {
      setProcesandoPdf(false);
    }
  };

  /* ============ PROCESAMIENTO AUTOMÁTICO DE UN PDF ============ */
  const handleProcesamientoAutomatico = async () => {
    if (!pdfFile) {
      setError('Primero debes subir un PDF');
      return;
    }

    setAutoProcesando(true);
    setError(null);
    setResultadoAuto(null);
    setResultado(null);
    setIncapacidadGuardada(null);

    try {
      const imageBase64 = await convertirPdfAImagen(pdfFile);

      let pdfUrl: string | undefined;
      try {
        const formDataPdf = new FormData();
        formDataPdf.append('file', pdfFile);
        formDataPdf.append('identificacion', 'auto');
        const resPdf = await fetch('/api/incapacidades/pdf', {
          method: 'POST',
          body: formDataPdf,
        });
        const dataPdf = await resPdf.json();
        if (dataPdf.success && dataPdf.url) pdfUrl = dataPdf.url;
      } catch {}

      const res = await fetch('/api/ia/procesar-completo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, pdfUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar automáticamente');
      }

      setResultadoAuto(data);
      setResultado(data.liquidacion);
      setIncapacidadGuardada(data.incapacidad_id);
      setMensajePdf(`✅ Liquidado automáticamente: ${data.empleado.nombre}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setAutoProcesando(false);
    }
  };

  /* ============ PROCESAMIENTO POR LOTES ============ */
  const handleProcesamientoLote = async () => {
    if (pdfFiles.length === 0) {
      setError('Primero debes seleccionar al menos un PDF');
      return;
    }

    setProcesandoLote(true);
    setError(null);
    setResultadoLote(null);

    try {
      const archivos: { nombre: string; imageBase64: string; pdfUrl?: string }[] = [];

      for (const file of pdfFiles) {
        try {
          const imageBase64 = await convertirPdfAImagen(file);

          let pdfUrl: string | undefined;
          try {
            const formDataPdf = new FormData();
            formDataPdf.append('file', file);
            formDataPdf.append('identificacion', 'lote');
            const resPdf = await fetch('/api/incapacidades/pdf', {
              method: 'POST',
              body: formDataPdf,
            });
            const dataPdf = await resPdf.json();
            if (dataPdf.success) pdfUrl = dataPdf.url;
          } catch {}

          archivos.push({ nombre: file.name, imageBase64, pdfUrl });
        } catch (err) {
          console.warn(`Error con ${file.name}:`, err);
        }
      }

      if (archivos.length === 0) {
        throw new Error('No se pudo procesar ningún PDF');
      }

      const res = await fetch('/api/ia/procesar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivos }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el lote');
      }

      setResultadoLote(data);
      setMensajePdf(
        `✅ Lote procesado: ${data.resumen.exitosos} exitosos, ${data.resumen.fallidos} fallidos`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setProcesandoLote(false);
    }
  };

  /* ============ LIQUIDACIÓN MANUAL ============ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setResultado(null);
    setResultadoAuto(null);
    setIncapacidadGuardada(null);

    try {
      const empleado = empleados.find((e) => e.id === Number(formData.empleado_id));

      let pdfUrl: string | undefined;
      if (pdfFile) {
        try {
          const formDataPdf = new FormData();
          formDataPdf.append('file', pdfFile);
          formDataPdf.append(
            'identificacion',
            empleado?.numero_identificacion || 'sin-cc'
          );

          const resPdf = await fetch('/api/incapacidades/pdf', {
            method: 'POST',
            body: formDataPdf,
          });
          const dataPdf = await resPdf.json();
          if (dataPdf.success && dataPdf.url) pdfUrl = dataPdf.url;
        } catch (errPdf) {
          console.warn('No se pudo subir el PDF:', errPdf);
        }
      }

      const response = await fetch('/api/incapacidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: Number(formData.empresa_id),
          empleado_id: Number(formData.empleado_id),
          tipo: formData.tipo,
          subtipo: formData.subtipo,
          anio: Number(formData.anio),
          dias: Number(formData.dias),
          ibc: formData.ibc ? Number(formData.ibc) : undefined,
          fecha_inicio: formData.fechaInicio,
          fecha_fin: formData.fechaFin,
          fecha_ingreso_empleado: empleado?.fecha_ingreso || undefined,
          diagnostico_cie10: formData.diagnostico_cie10 || undefined,
          pdf_url: pdfUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al liquidar');
      }

      setResultado(data.resultado);
      setIncapacidadGuardada(data.incapacidad.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  const formatearPeso = (valor: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);

  return (
    <main className="min-h-screen relative">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 relative z-10 sm:px-6 lg:px-8">
        {/* ============ ENCABEZADO ============ */}
        <header className="mb-8 animate-fade-in-up">
          <h1 className="text-[42px] sm:text-[52px] font-semibold leading-[1.05] tracking-[-0.03em] text-gray-900 dark:text-white">
            Liquidación de incapacidades
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-500 dark:text-white/60 font-light tracking-tight">
            Sube uno o varios PDFs. La IA extraerá los datos, buscará a los
            empleados y liquidará automáticamente.
          </p>
        </header>

        {/* ============ LAYOUT 2 COLUMNAS ============ */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr]">
          {/* Card de PDF con IA */}
          <section
            className="relative overflow-hidden rounded-2xl border border-blue-500/20 dark:border-blue-400/30 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 backdrop-blur-xl p-6 lg:col-start-2 lg:row-start-1 animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative flex items-start gap-4">
              <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <div className="absolute inset-0 blur-md opacity-60 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600" />
                <Stethoscope
                  className="relative h-6 w-6 text-white"
                  strokeWidth={1.75}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                  Procesar PDF con IA
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </h3>
                <p className="mb-4 mt-1 text-[14px] leading-snug text-gray-600 dark:text-white/60 font-light">
                  Selecciona uno o varios PDFs. Con uno solo, verás los datos
                  extraídos. Con varios, se procesarán en lote automáticamente.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={procesandoPdf || autoProcesando || procesandoLote}
                  className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg shadow-blue-500/25 outline-none transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {procesandoPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                  ) : (
                    <Upload className="h-4 w-4" strokeWidth={2.5} />
                  )}
                  {procesandoPdf ? 'Procesando PDF…' : 'Subir PDF(s)'}
                </button>

                {/* Botón procesar lote (múltiples) */}
                {pdfFiles.length > 1 && (
                  <button
                    type="button"
                    onClick={handleProcesamientoLote}
                    disabled={procesandoLote}
                    className="btn-shimmer mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg shadow-indigo-500/25 outline-none transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {procesandoLote ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        Procesando {pdfFiles.length} PDFs…
                      </>
                    ) : (
                      <>
                        <Files className="h-4 w-4" strokeWidth={2.5} />
                        Procesar {pdfFiles.length} PDFs en lote
                      </>
                    )}
                  </button>
                )}

                {/* Botón procesar individual (un solo PDF) */}
                {pdfFile && !procesandoPdf && pdfFiles.length === 1 && (
                  <button
                    type="button"
                    onClick={handleProcesamientoAutomatico}
                    disabled={autoProcesando}
                    className="btn-shimmer mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg shadow-emerald-500/25 outline-none transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {autoProcesando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        Procesando y liquidando…
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" strokeWidth={2.5} />
                        Procesar y liquidar automáticamente
                      </>
                    )}
                  </button>
                )}

                {mensajePdf && (
                  <p
                    role="status"
                    className="mt-4 flex items-start gap-2 text-[13px] font-medium leading-snug text-emerald-700 dark:text-emerald-400"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 flex-shrink-0"
                      strokeWidth={2.25}
                    />
                    {mensajePdf}
                  </p>
                )}

                {/* Lista de archivos seleccionados */}
                {pdfFiles.length === 1 && pdfFile && (
                  <p className="mt-2 text-[11px] text-gray-500 dark:text-white/50">
                    📎 {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                {pdfFiles.length > 1 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                      📚 {pdfFiles.length} archivos seleccionados:
                    </p>
                    <ul className="text-[10px] text-gray-500 dark:text-white/50 max-h-24 overflow-y-auto">
                      {pdfFiles.map((f, i) => (
                        <li key={i} className="truncate">
                          • {f.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Formulario manual */}
          <form
            onSubmit={handleSubmit}
            className="glass-premium rounded-2xl space-y-8 p-6 sm:p-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 animate-fade-in-up"
            style={{ animationDelay: '160ms' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg">
                <div className="absolute inset-0 blur-md opacity-60 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600" />
                <User className="relative h-4 w-4 text-white" strokeWidth={2.25} />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
                  Liquidación manual
                </h2>
                <p className="text-[12px] text-gray-500 dark:text-white/60 font-light">
                  También puedes completar los datos tú mismo
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-white/[0.08]" />

            {empresas.length === 0 && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl bg-orange-500/12 border border-orange-500/20 p-4 text-[14px] text-orange-700 dark:text-orange-400"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 flex-shrink-0"
                  strokeWidth={2}
                />
                <span>No hay empresas registradas. Crea una primero.</span>
              </div>
            )}

            <Seccion
              icono={Building2}
              gradiente="bg-gradient-to-br from-blue-500 to-indigo-600"
              titulo="Empresa y empleado"
            >
              <Campo label="Empresa" htmlFor="empresa_id">
                <Select
                  id="empresa_id"
                  name="empresa_id"
                  value={formData.empresa_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una empresa</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} — NIT {emp.nit}
                    </option>
                  ))}
                </Select>
              </Campo>

              <Campo
                label="Empleado"
                htmlFor="empleado_id"
                hint={
                  formData.empresa_id && empleados.length === 0
                    ? 'Esta empresa no tiene empleados registrados.'
                    : undefined
                }
              >
                <Select
                  id="empleado_id"
                  name="empleado_id"
                  value={formData.empleado_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.empresa_id}
                >
                  <option value="">Selecciona un empleado</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} — CC {emp.numero_identificacion}
                    </option>
                  ))}
                </Select>
              </Campo>
            </Seccion>

            <div className="h-px bg-gray-200 dark:bg-white/[0.08]" />

            <Seccion
              icono={FileText}
              gradiente="bg-gradient-to-br from-orange-400 to-orange-500"
              titulo="Datos de la incapacidad"
              columnas="md:grid-cols-2 lg:grid-cols-3"
            >
              <Campo label="Tipo de prestación" htmlFor="tipo">
                <Select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                >
                  <option value="EG">Enfermedad General (EG)</option>
                  <option value="ARL">Accidente/Enfermedad Laboral (ARL)</option>
                  <option value="LM">Licencia de Maternidad (LM)</option>
                  <option value="LP">Licencia de Paternidad (LP)</option>
                </Select>
              </Campo>

              <Campo label="Subtipo" htmlFor="subtipo">
                <Select
                  id="subtipo"
                  name="subtipo"
                  value={formData.subtipo}
                  onChange={handleChange}
                >
                  <option value="NUEVA">Nueva</option>
                  <option value="PRORROGA">Prórroga</option>
                </Select>
              </Campo>

              <Campo
                label="Año de la incapacidad"
                htmlFor="anio"
                className="md:col-span-2 lg:col-span-1"
              >
                <Select
                  id="anio"
                  name="anio"
                  value={formData.anio}
                  onChange={handleChange}
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2017">2017</option>
                </Select>
              </Campo>

              <Campo label="IBC" htmlFor="ibc">
                <Input
                  id="ibc"
                  type="number"
                  name="ibc"
                  value={formData.ibc}
                  onChange={handleChange}
                  placeholder="Ej: 2500000"
                />
              </Campo>

              <Campo
                label="Diagnóstico CIE-10"
                htmlFor="diagnostico_cie10"
                className="md:col-span-1 lg:col-span-2"
              >
                <Input
                  id="diagnostico_cie10"
                  type="text"
                  name="diagnostico_cie10"
                  value={formData.diagnostico_cie10}
                  onChange={handleChange}
                  placeholder="Ej: J11"
                />
              </Campo>
            </Seccion>

            <div className="h-px bg-gray-200 dark:bg-white/[0.08]" />

            <Seccion
              icono={Calendar}
              gradiente="bg-gradient-to-br from-red-400 to-red-500"
              titulo="Fechas y duración"
              columnas="md:grid-cols-2 lg:grid-cols-3"
            >
              <Campo label="Fecha de inicio" htmlFor="fechaInicio">
                <Input
                  id="fechaInicio"
                  type="date"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  required
                />
              </Campo>

              <Campo label="Fecha de fin" htmlFor="fechaFin">
                <Input
                  id="fechaFin"
                  type="date"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleChange}
                  required
                />
              </Campo>

              <Campo
                label="Días de incapacidad"
                htmlFor="dias"
                className="md:col-span-2 lg:col-span-1"
              >
                <Input
                  id="dias"
                  type="number"
                  name="dias"
                  value={formData.dias}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 10"
                />
              </Campo>
            </Seccion>

            <button
              type="submit"
              disabled={cargando || !formData.empleado_id}
              className="btn-shimmer flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-3.5 text-[15px] font-medium text-white shadow-lg shadow-blue-500/25 outline-none transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/30 focus-visible:ring-4 focus-visible:ring-blue-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {cargando ? (
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.25} />
              ) : (
                <Calculator className="h-5 w-5" strokeWidth={2} />
              )}
              {cargando ? 'Calculando y guardando…' : 'Liquidar y guardar'}
            </button>
          </form>

          {/* Resultado / error */}
          <div className="space-y-4 lg:col-start-2 lg:row-start-2">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-[14px] text-red-700 dark:text-red-400 animate-shake"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 flex-shrink-0"
                  strokeWidth={2}
                />
                <p>
                  <span className="font-semibold">
                    No se pudo completar la acción.{' '}
                  </span>
                  {error}
                </p>
              </div>
            )}

            {/* Panel de resultados del LOTE */}
            {resultadoLote && (
              <section className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 backdrop-blur-xl p-6 animate-fade-in-up">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                      <Files className="relative h-5 w-5 text-white" strokeWidth={2.25} />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold tracking-tight text-gray-900 dark:text-white">
                        Lote procesado
                      </h2>
                      <p className="text-[12px] text-gray-600 dark:text-white/60">
                        {resultadoLote.resumen.exitosos} exitosos · {resultadoLote.resumen.fallidos} fallidos
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-xl bg-white/40 dark:bg-white/[0.06] border border-gray-200/60 dark:border-white/[0.1] p-3">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-white/60">Total</p>
                      <p className="text-[20px] font-semibold text-gray-900 dark:text-white">{resultadoLote.resumen.total}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Exitosos</p>
                      <p className="text-[20px] font-semibold text-emerald-700 dark:text-emerald-400">{resultadoLote.resumen.exitosos}</p>
                    </div>
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-red-700 dark:text-red-400">Fallidos</p>
                      <p className="text-[20px] font-semibold text-red-700 dark:text-red-400">{resultadoLote.resumen.fallidos}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 mb-4">
                    <p className="text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Total liquidado</p>
                    <p className="text-[22px] font-semibold text-indigo-700 dark:text-indigo-300">
                      {formatearPeso(resultadoLote.resumen.totalLiquidado)}
                    </p>
                  </div>

                  <details className="text-[12px]">
                    <summary className="cursor-pointer text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white mb-2">
                      Ver detalle por archivo
                    </summary>
                    <ul className="space-y-1.5 mt-2 max-h-64 overflow-y-auto">
                      {resultadoLote.resultados.map((r, i) => (
                        <li
                          key={i}
                          className={`flex items-start gap-2 p-2 rounded-lg text-[11px] ${
                            r.success
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-700 dark:text-red-400'
                          }`}
                        >
                          <span className="flex-shrink-0">{r.success ? '✅' : '❌'}</span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{r.archivo}</p>
                            {r.success ? (
                              <p className="text-[10px] opacity-80">
                                {r.empleado?.nombre} · #{r.incapacidad_id} · {formatearPeso(r.liquidacion?.monto || 0)}
                              </p>
                            ) : (
                              <p className="text-[10px] opacity-80">{r.error}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </section>
            )}

            {/* Card resultado automático individual */}
            {resultadoAuto && (
              <section className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-xl p-6 animate-fade-in-up">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/25 blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                      <div className="absolute inset-0 blur-md opacity-60 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600" />
                      <Zap className="relative h-5 w-5 text-white" strokeWidth={2.25} />
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold tracking-tight text-gray-900 dark:text-white">
                        Procesado automáticamente
                      </h2>
                      <p className="text-[12px] text-gray-600 dark:text-white/60">
                        La IA extrajo los datos, buscó al empleado y liquidó
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-white/80">
                      <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium">{resultadoAuto.empleado.nombre}</span>
                    </div>
                    {resultadoAuto.empresa && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-700 dark:text-white/80">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{resultadoAuto.empresa.nombre}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {resultado ? (
              <section
                ref={resultadoRef}
                aria-live="polite"
                className="glass-premium border-iris rounded-2xl scroll-mt-20 p-6 animate-fade-in-up"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                      <div className="absolute inset-0 blur-md opacity-60 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600" />
                      <CheckCircle2
                        className="relative h-[18px] w-[18px] text-white"
                        strokeWidth={2.25}
                      />
                    </div>
                    <h2 className="text-[19px] font-bold tracking-tight text-gray-900 dark:text-white">
                      Resultado
                    </h2>
                  </div>
                  {incapacidadGuardada && (
                    <span className="rounded-full bg-gray-500/10 dark:bg-white/[0.08] border border-gray-300/40 dark:border-white/[0.1] px-2.5 py-1 text-[11px] font-medium tabular-nums text-gray-600 dark:text-white/60">
                      Guardada · #{incapacidadGuardada}
                    </span>
                  )}
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-100/60 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] p-3.5">
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60">
                      Estado
                    </p>
                    {(() => {
                      const estilo = estiloEstado(resultado.estado);
                      const Icono = estilo.icono;
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium ${estilo.pill}`}
                        >
                          <Icono
                            className={`h-3 w-3 ${estilo.iconoColor}`}
                            strokeWidth={2.5}
                          />
                          {estilo.etiqueta}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="rounded-xl bg-gray-100/60 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] p-3.5">
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60">
                      Días liquidables
                    </p>
                    <p className="text-[22px] font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
                      {resultado.diasLiquidables}
                    </p>
                  </div>

                  <div className="relative col-span-2 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border border-blue-500/25 dark:border-blue-400/30 p-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
                    <div className="relative">
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-blue-700 dark:text-blue-300">
                        Monto a reconocer
                      </p>
                      <p className="text-[30px] font-semibold leading-tight tabular-nums tracking-tight text-gray-900 dark:text-white">
                        {formatearPeso(resultado.monto)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-white/[0.08] pt-5">
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60">
                    Fórmula aplicada
                  </p>
                  <code className="block overflow-x-auto rounded-xl bg-gray-900 dark:bg-black/60 p-4 font-mono text-[12.5px] leading-relaxed text-emerald-400 ring-1 ring-gray-800 dark:ring-white/[0.08]">
                    {resultado.formula}
                  </code>
                </div>

                {resultado.observaciones.length > 0 && (
                  <div className="mt-5 border-t border-gray-200 dark:border-white/[0.08] pt-5">
                    <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-white/60">
                      Observaciones
                    </p>
                    <ul className="space-y-2.5">
                      {resultado.observaciones.map((obs, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-[13px] leading-snug text-gray-700 dark:text-white/80"
                        >
                          <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                          {obs}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ) : !resultadoAuto && !resultadoLote ? (
              <section className="flex flex-col items-center gap-4 glass-premium border-iris rounded-2xl px-6 py-12 text-center">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1]">
                  {cargando || autoProcesando || procesandoLote ? (
                    <Loader2
                      className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <Calculator
                      className="h-6 w-6 text-gray-400 dark:text-white/40"
                      strokeWidth={1.75}
                    />
                  )}
                </div>
                <div>
                  <p className="text-[17px] font-semibold text-gray-900 dark:text-white">
                    {cargando || autoProcesando || procesandoLote
                      ? 'Procesando…'
                      : 'Aquí verás el resultado'}
                  </p>
                  <p className="mt-1 text-[14px] leading-snug text-gray-500 dark:text-white/60 font-light">
                    {cargando || autoProcesando || procesandoLote
                      ? 'Estamos extrayendo datos y liquidando las incapacidades.'
                      : 'Sube uno o varios PDFs para procesamiento automático, o completa el formulario manual.'}
                  </p>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}