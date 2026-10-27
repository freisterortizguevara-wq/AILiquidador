'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] group"
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {/* Sol — visible en modo claro */}
      <Sun
        className={`absolute w-4 h-4 text-amber-500 transition-all duration-300 ${
          theme === 'light'
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
        strokeWidth={2.2}
      />

      {/* Luna — visible en modo oscuro */}
      <Moon
        className={`absolute w-4 h-4 text-white/80 transition-all duration-300 ${
          theme === 'dark'
            ? 'rotate-0 scale-100 opacity-100'
            : '-rotate-90 scale-0 opacity-0'
        }`}
        strokeWidth={2.2}
      />

      {/* Halo sutil al hover */}
      <span className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/10 transition-colors" />
    </button>
  );
}