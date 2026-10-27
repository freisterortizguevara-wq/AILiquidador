'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';

interface ResumenData {
  empresa: { nombre: string; nit: string };
  periodo: string;
  resumen: {
    totalIncapacidades: number;
    totalLiquidado: number;
    porTipo: Record<string, { cantidad: number; monto: number }>;
    porEstado: Record<string, { cantidad: number; monto: number }>;
  };
  diasLiquidables: number;
  promedio: number;
}

export default function ResumenEjecutivo({ data }: { data: ResumenData }) {
  const [texto, setTexto] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    setCargando(true);
    setError(null);
    setTexto(null);

    try {
      const res = await fetch('/api/ia/resumen-ejecutivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al generar resumen');

      setTexto(json.resumen);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    generar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 dark:border-blue-400/30 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 backdrop-blur-xl p-6 animate-fade-in-up">
      {/* Aurora decorativa interna */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <div className="absolute inset-0 blur-md opacity-60 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600" />
              <Sparkles className="relative h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold tracking-tight text-gray-900 dark:text-white">
                Resumen ejecutivo
              </h3>
              <p className="text-[12px] text-gray-500 dark:text-white/60 font-light">
                Generado por IA a partir de los datos del período
              </p>
            </div>
          </div>

          {!cargando && texto && (
            <button
              onClick={generar}
              className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.1] px-3 py-1.5 text-[11px] font-medium text-gray-600 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
              aria-label="Regenerar resumen"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerar
            </button>
          )}
        </div>

        {cargando && (
          <div className="flex items-center gap-3 text-[14px] text-gray-500 dark:text-white/60">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <span>Analizando los datos del período...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-[13px] text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {texto && !cargando && (
          <div className="space-y-3 text-[14px] leading-relaxed text-gray-700 dark:text-white/85">
            {texto.split('\n').filter(Boolean).map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}