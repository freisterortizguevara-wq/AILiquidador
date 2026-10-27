'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Loader2, Check } from 'lucide-react';

export default function BotonLogout() {
  const router = useRouter();
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'listo'>('idle');

  const handleLogout = async () => {
    if (estado !== 'idle') return;

    setEstado('cargando');

    try {
      await fetch('/api/auth/logout', { method: 'POST' });

      setEstado('listo');

      // Pequeña pausa para mostrar el check ✓
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 550);
    } catch {
      setEstado('idle');
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={estado !== 'idle'}
      aria-label="Cerrar sesión"
      className="
        group
        relative
        flex
        items-center
        gap-2
        overflow-hidden
        rounded-[14px]
        border
        border-black/[0.06]
        bg-white/60
        px-3.5
        py-2
        text-[13.5px]
        font-medium
        text-black/60
        shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]
        backdrop-blur-xl
        transition-all
        duration-300
        hover:border-red-500/20
        hover:bg-red-500/[0.06]
        hover:text-red-600
        hover:shadow-[0_6px_20px_-8px_rgba(255,55,95,0.5),inset_0_1px_0_rgba(255,255,255,0.9)]
        active:scale-[0.96]
        focus:outline-none
        focus:ring-4
        focus:ring-red-500/15
        disabled:cursor-not-allowed
        dark:border-white/[0.10]
        dark:bg-white/[0.06]
        dark:text-white/60
        dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]
        dark:hover:border-red-500/30
        dark:hover:bg-red-500/[0.12]
        dark:hover:text-red-400
        dark:hover:shadow-[0_6px_20px_-8px_rgba(255,55,95,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]
        dark:focus:ring-red-500/20
      "
    >
      {/* Shimmer al hover */}
      <span
        className="
          pointer-events-none
          absolute
          inset-0
          -translate-x-full
          bg-gradient-to-r
          from-transparent
          via-white/40
          to-transparent
          transition-transform
          duration-[900ms]
          ease-out
          group-hover:translate-x-full
          dark:via-white/10
        "
      />

      {/* Glow pulsante detrás cuando está listo */}
      {estado === 'listo' && (
        <span
          className="
            pointer-events-none
            absolute
            inset-0
            rounded-[14px]
            bg-emerald-500/20
            animate-ping-slow
          "
        />
      )}

      {/* Icono */}
      <span className="relative flex h-4 w-4 items-center justify-center">
        {estado === 'idle' && (
          <LogOut
            className="
              h-4 w-4
              transition-transform
              duration-300
              group-hover:-translate-x-0.5
            "
            strokeWidth={2}
          />
        )}

        {estado === 'cargando' && (
          <Loader2
            className="h-4 w-4 animate-spin"
            strokeWidth={2}
          />
        )}

        {estado === 'listo' && (
          <Check
            className="h-4 w-4 text-emerald-500 animate-pop-in"
            strokeWidth={2.5}
          />
        )}
      </span>

      {/* Texto */}
      <span className="relative hidden md:inline">
        {estado === 'idle' && 'Cerrar sesión'}
        {estado === 'cargando' && 'Cerrando…'}
        {estado === 'listo' && 'Listo'}
      </span>
    </button>
  );
}