'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Sparkles, AlertCircle, MessageCircle, BookOpen } from 'lucide-react';

interface Mensaje {
  rol: 'usuario' | 'asistente';
  contenido: string;
  contexto?: { titulo: string; similitud: number }[];
}

const SUGERENCIAS = [
  '¿Cuántos días se restan en una EG nueva?',
  '¿Cuándo una incapacidad se marca como prescrita?',
  '¿Cómo se liquida una licencia de maternidad?',
  '¿Cuál es el SMLV del 2026?',
];

const TARJETA =
  'rounded-2xl bg-white/80 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-[#1c1c1e]/80 dark:ring-white/[0.1] dark:shadow-none';

// Avatar del asistente: pequeño squircle azul, como el logo de la app
function AvatarAsistente() {
  return (
    <div className="mb-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center self-end rounded-[8px] bg-gradient-to-b from-[#3b9eff] to-[#0071e3] shadow-[inset_0_0.5px_0_rgba(255,255,255,0.35)]">
      <Sparkles className="h-4 w-4 text-white" strokeWidth={2.25} />
    </div>
  );
}

export default function ChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: 'asistente',
      contenido:
        'Hola, soy tu asistente de incapacidades. Puedes preguntarme sobre normativa, liquidaciones, plazos, SMLV, prescripción, etc. ¿En qué te puedo ayudar?',
    },
  ]);
  const [pregunta, setPregunta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Desplaza solo el área de mensajes (no toda la página) al final
  useEffect(() => {
    const el = contenedorRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [mensajes, cargando]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pregunta.trim() || cargando) return;

    const preguntaActual = pregunta.trim();
    setPregunta('');
    setMensajes((prev) => [...prev, { rol: 'usuario', contenido: preguntaActual }]);
    setCargando(true);
    setError(null);

    try {
      const res = await fetch('/api/rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: preguntaActual }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener respuesta');

      setMensajes((prev) => [
        ...prev,
        {
          rol: 'asistente',
          contenido: data.respuesta,
          contexto: data.contexto,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  const usarSugerencia = (texto: string) => {
    setPregunta(texto);
    inputRef.current?.focus();
  };

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 pt-10 text-[#1d1d1f] dark:text-[#f5f5f7] sm:px-6 lg:px-8">
      {/* Encabezado */}
      <header className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-b from-[#3b9eff] to-[#0071e3] shadow-[0_4px_12px_-2px_rgba(0,113,227,0.4),inset_0_0.5px_0_rgba(255,255,255,0.35)]">
          <Sparkles className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[34px] font-bold leading-tight tracking-tight">Asistente IA</h1>
          <p className="text-[17px] text-black/55 dark:text-white/55">
            Pregunta sobre incapacidades, liquidaciones y normativa
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Conversación */}
        <section
          className={`${TARJETA} flex h-[calc(100vh-14rem)] min-h-[480px] flex-col overflow-hidden`}
        >
          <div
            ref={contenedorRef}
            role="log"
            aria-live="polite"
            aria-label="Conversación"
            className="flex-1 space-y-3 overflow-y-auto px-5 py-6 sm:px-8"
          >
            {mensajes.map((msg, i) => {
              const esUsuario = msg.rol === 'usuario';
              return (
                <div
                  key={i}
                  className={`flex gap-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] starting:translate-y-2 starting:opacity-0 ${
                    esUsuario ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!esUsuario && <AvatarAsistente />}
                  <div
                    className={`max-w-[85%] px-4 py-2.5 sm:max-w-[75%] ${
                      esUsuario
                        ? 'rounded-[20px] rounded-br-[6px] bg-[#0071e3] text-white dark:bg-[#0a84ff]'
                        : 'rounded-[20px] rounded-bl-[6px] bg-black/[0.06] text-[#1d1d1f] dark:bg-white/[0.1] dark:text-[#f5f5f7]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {msg.contenido}
                    </p>

                    {msg.contexto && msg.contexto.length > 0 && (
                      <div className="mt-3 border-t border-black/[0.08] pt-3 dark:border-white/[0.12]">
                        <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-black/50 dark:text-white/50">
                          <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
                          Fuentes consultadas
                        </p>
                        <ul className="flex flex-wrap gap-1.5">
                          {msg.contexto.map((c, j) => (
                            <li
                              key={j}
                              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[12px] text-black/70 ring-1 ring-black/[0.06] dark:bg-black/25 dark:text-white/70 dark:ring-white/[0.1]"
                            >
                              <span className="truncate">{c.titulo}</span>
                              <span className="flex-shrink-0 tabular-nums font-medium text-[#0071e3] dark:text-[#64afff]">
                                {Math.round(c.similitud * 100)}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Indicador de escritura */}
            {cargando && (
              <div className="flex justify-start gap-2">
                <AvatarAsistente />
                <div
                  role="status"
                  className="flex items-center gap-1 rounded-[20px] rounded-bl-[6px] bg-black/[0.06] px-4 py-3.5 dark:bg-white/[0.1]"
                >
                  <span className="sr-only">Pensando…</span>
                  {[0, 150, 300].map((retraso) => (
                    <span
                      key={retraso}
                      style={{ animationDelay: `${retraso}ms` }}
                      className="h-2 w-2 animate-bounce rounded-full bg-black/35 dark:bg-white/40"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mx-4 mb-2 flex items-start gap-2.5 rounded-xl bg-[#ff3b30]/10 px-3.5 py-2.5 text-[14px] text-[#d70015] dark:text-[#ff453a] sm:mx-6"
            >
              <AlertCircle className="mt-0.5 h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {/* Barra de escritura */}
          <form
            onSubmit={enviar}
            className="border-t border-black/[0.08] bg-white/50 px-4 py-3 backdrop-blur-xl dark:border-white/[0.1] dark:bg-[#1c1c1e]/50 sm:px-6"
          >
            <div className="relative">
              <label htmlFor="pregunta" className="sr-only">
                Escribe tu pregunta
              </label>
              <input
                id="pregunta"
                ref={inputRef}
                type="text"
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                placeholder="Pregunta algo, p. ej. ¿Cuántos días se restan en una EG nueva?"
                disabled={cargando}
                autoComplete="off"
                className="w-full rounded-full bg-black/[0.05] py-3 pl-5 pr-14 text-[15px] text-[#1d1d1f] outline-none transition-[background-color,box-shadow] duration-200 placeholder:text-black/35 hover:bg-black/[0.07] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/70 disabled:opacity-60 dark:bg-white/[0.08] dark:text-[#f5f5f7] dark:placeholder:text-white/35 dark:hover:bg-white/[0.11] dark:focus:bg-[#2c2c2e]"
              />
              <button
                type="submit"
                aria-label="Enviar pregunta"
                disabled={cargando || !pregunta.trim()}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#0071e3] text-white outline-none transition-all duration-200 hover:bg-[#0077ed] focus-visible:ring-2 focus-visible:ring-[#0071e3]/60 focus-visible:ring-offset-2 active:scale-90 disabled:scale-90 disabled:cursor-not-allowed disabled:bg-black/[0.15] dark:disabled:bg-white/[0.15]"
              >
                <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.75} />
              </button>
            </div>
          </form>
        </section>

        {/* Panel lateral */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <section className={`${TARJETA} p-5`}>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#ffb340] to-[#ff9500] shadow-[inset_0_0.5px_0_rgba(255,255,255,0.35)]">
                <MessageCircle className="h-4 w-4 text-white" strokeWidth={2.25} />
              </div>
              <h2 className="text-[17px] font-semibold tracking-tight">Prueba preguntar</h2>
            </div>
            <ul className="-mx-2 space-y-0.5">
              {SUGERENCIAS.map((sugerencia) => (
                <li key={sugerencia}>
                  <button
                    type="button"
                    onClick={() => usarSugerencia(sugerencia)}
                    className="w-full rounded-lg px-2 py-2 text-left text-[14px] leading-snug text-[#1d1d1f] outline-none transition-colors duration-150 hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-[#0071e3]/60 active:bg-black/[0.08] dark:text-[#f5f5f7] dark:hover:bg-white/[0.08] dark:active:bg-white/[0.12]"
                  >
                    {sugerencia}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <p className="px-2 text-[13px] leading-snug text-black/45 dark:text-white/45">
            Cada respuesta indica las fuentes consultadas y su relevancia. Verifica
            los datos importantes antes de tomar decisiones de liquidación.
          </p>
        </aside>
      </div>
    </main>
  );
}
