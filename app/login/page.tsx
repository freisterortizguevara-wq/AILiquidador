'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowRight, AlertCircle, Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    numero_identificacion: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

      router.push('/liquidar');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden px-4">
      {/* ============ FONDO AURORA ANIMADO ============ */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blob 1 - Azul */}
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-40 blur-[120px] animate-aurora-1"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
        />
        {/* Blob 2 - Índigo */}
        <div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full opacity-35 blur-[130px] animate-aurora-2"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
        {/* Blob 3 - Violeta */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-25 blur-[140px] animate-aurora-3"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}
        />
      </div>

      {/* Grid sutil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />

      {/* Grain / ruido */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ============ CONTENIDO ============ */}
      <div className="relative w-full max-w-[440px] z-10">
        {/* Logo con glow */}
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-full animate-pulse-glow" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <FileText className="w-7 h-7 text-white" strokeWidth={1.8} />
            </div>
          </div>
        </div>

        {/* Título editorial */}
        <div className="text-center mb-10">
          <h1 className="text-[42px] sm:text-[48px] font-semibold tracking-[-0.03em] leading-[1.05] text-white mb-3">
            Accede al{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              sistema
            </span>
          </h1>
          <p className="text-[15px] text-white/50 font-light tracking-tight">
            Gestión inteligente de incapacidades laborales
          </p>
        </div>

        {/* Card glassmorphism */}
        <div className="relative">
          {/* Borde superior con gradiente */}
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
            {/* Highlight interior */}
            <div className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[12px] font-medium text-white/60 uppercase tracking-[0.08em] mb-2.5">
                  Identificación
                </label>
                <input
                  type="text"
                  name="numero_identificacion"
                  value={formData.numero_identificacion}
                  onChange={handleChange}
                  required
                  autoFocus
                  placeholder="1234567890"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 text-[15px] text-white placeholder:text-white/25 outline-none transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.12] focus:bg-white/[0.06] focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-white/60 uppercase tracking-[0.08em] mb-2.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••••"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 text-[15px] text-white placeholder:text-white/25 outline-none transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.12] focus:bg-white/[0.06] focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-2xl text-[13px] backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="group relative w-full overflow-hidden bg-white text-gray-900 py-4 rounded-2xl font-semibold text-[15px] tracking-tight hover:bg-white/95 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 mt-2"
              >
                {/* Shimmer effect */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />

                <span className="relative flex items-center justify-center gap-2">
                  {cargando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-transparent text-[11px] text-white/30 uppercase tracking-[0.1em] backdrop-blur-sm">
                  o
                </span>
              </div>
            </div>

            {/* Botón alternativo */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 text-[14px] text-white/70 hover:text-white group"
            >
              <Fingerprint className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
              Acceso biométrico
            </button>
          </div>

          {/* Borde inferior con gradiente */}
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-white/30 font-light tracking-[0.05em]">
            Acceso restringido · Solo personal autorizado
          </p>
          <p className="text-[10px] text-white/20 font-light tracking-wider mt-3">
            © 2026 SISTEMA DE INCAPACIDADES
          </p>
        </div>
      </div>
    </main>
  );
}