'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ClipboardList,
  BarChart3,
  Sparkles,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  Users,
  Bell,
  Settings,
  User,
  Command,
  BookOpen,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface SesionUsuario {
  nombre: string;
  rol: 'ADMIN' | 'ANALISTA' | 'AUXILIAR';
}

const MENU_ITEMS = [
  { href: '/liquidar', label: 'Liquidar', icon: ClipboardList, atajo: 'L' },
  { href: '/incapacidades', label: 'Historial', icon: FileText, atajo: 'H' },
  { href: '/empresas', label: 'Empresas', icon: Building2, atajo: 'E' },
  { href: '/empleados', label: 'Empleados', icon: Users, atajo: 'M' },
  { href: '/reportes', label: 'Reportes', icon: BarChart3, atajo: 'R' },
  { href: '/chat', label: 'Asistente IA', icon: Sparkles, atajo: 'I' },
  { href: '/conocimiento', label: 'Conocimiento', icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const esLogin = pathname === '/login';

  // Scroll: progreso + estado
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setScrolled(scrolled);

      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cursor glow sobre el navbar
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    nav.addEventListener('mousemove', handleMouseMove);
    return () => nav.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Cargar usuario
  useEffect(() => {
    if (!esLogin) {
      fetch('/api/auth/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success) setUsuario(data.usuario);
        })
        .catch(() => {});
    }
  }, [esLogin, pathname]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Futuro: abrir paleta de comandos
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
    setMenuUsuario(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (esLogin) return null;

  const iniciales = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <>
      {/* Barra de progreso de scroll */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-[60] transition-[width] duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      <nav
        ref={navRef}
        className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? 'bg-white/70 dark:bg-[#0a1428]/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
            : 'bg-white/85 dark:bg-[#0a1428]/85 backdrop-blur-xl border-b border-transparent'
        }`}
      >
        {/* Cursor glow — aparece solo en modo oscuro */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block"
          aria-hidden
        >
          <div
            className="absolute w-[300px] h-[300px] rounded-full opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)',
            }}
          />
        </div>

        {/* Línea luminosa superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/0 dark:via-blue-400/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 relative">
          {/* Logo */}
          <Link
            href="/liquidar"
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/40 blur-md rounded-lg opacity-60 group-hover:bg-blue-500/70 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FileText className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-gray-900 dark:text-white text-[13px] leading-tight tracking-tight">
                Incapacidades
              </p>
              <p className="text-[10px] text-gray-500 dark:text-white/40 leading-tight font-light tracking-wide">
                Sistema de gestión
              </p>
            </div>
          </Link>

          {/* Navegación desktop */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {MENU_ITEMS.map((item) => {
              const activo =
                pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative group flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-200 ${
                    activo
                      ? 'text-gray-900 dark:text-white bg-gray-100/50 dark:bg-white/[0.06]'
                      : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white/90 hover:bg-gray-100/40 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      activo ? 'scale-110' : 'group-hover:scale-110 group-hover:-rotate-3'
                    }`}
                    strokeWidth={activo ? 2.5 : 2}
                  />
                  <span>{item.label}</span>

                  {/* Atajo de teclado */}
                  <kbd
                    className={`hidden xl:inline-block ml-1 px-1.5 py-0.5 text-[9px] font-mono rounded border transition-opacity ${
                      activo
                        ? 'opacity-60 border-current'
                        : 'opacity-0 group-hover:opacity-40 border-gray-300 dark:border-white/20'
                    }`}
                  >
                    {item.atajo}
                  </kbd>

                  {/* Indicador activo con glow */}
                  {activo && (
                    <>
                      <span className="absolute -bottom-[15px] left-1/2 -translate-x-1/2 w-6 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                      <span className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-8 h-3 bg-blue-500/20 blur-md rounded-full" />
                    </>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Acciones + usuario */}
          <div className="flex items-center gap-1">
            {/* Búsqueda rápida (placeholder visual) */}
            <button
              className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg bg-gray-100/60 dark:bg-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.1] transition-colors group"
              aria-label="Buscar"
            >
              <Command className="w-3 h-3 text-gray-500 dark:text-white/50" />
              <span className="text-[11px] text-gray-500 dark:text-white/50 font-medium">
                Buscar
              </span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded border border-gray-300/60 dark:border-white/20 text-gray-500 dark:text-white/50">
                ⌘K
              </kbd>
            </button>

            {/* Notificaciones */}
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors group"
              aria-label="Notificaciones"
            >
              <Bell className="w-4 h-4 text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" strokeWidth={2.2} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0a1428] animate-pulse" />
            </button>

            {/* Tema */}
            <ThemeToggle />

            {/* Usuario */}
            <div className="relative">
              <button
                onClick={() => setMenuUsuario(!menuUsuario)}
                className="flex items-center gap-2 pl-0.5 pr-1 py-0.5 rounded-full hover:bg-gray-100/80 dark:hover:bg-white/[0.08] transition-all duration-200 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                  <div className="relative w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md ring-[1.5px] ring-white dark:ring-white/10">
                    {iniciales}
                  </div>
                  {/* Status dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#0a1428]" />
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-[11.5px] font-semibold text-gray-900 dark:text-white leading-tight max-w-[100px] truncate">
                    {usuario?.nombre || 'Usuario'}
                  </p>
                  <p className="text-[9.5px] text-gray-500 dark:text-white/40 leading-tight font-medium tracking-wide">
                    {usuario?.rol || 'SESIÓN'}
                  </p>
                </div>
                <ChevronDown
                  className={`hidden xl:block w-3 h-3 text-gray-400 dark:text-white/40 transition-transform duration-300 ${
                    menuUsuario ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown usuario */}
              {menuUsuario && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuUsuario(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-[#13131a]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)] border border-gray-200/60 dark:border-white/[0.08] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    {/* Línea luminosa superior del dropdown */}
                    <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                        {usuario?.nombre || 'Usuario'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-white/50 mt-0.5 inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        {usuario?.rol || 'N/A'}
                      </p>
                    </div>

                    <div className="py-1">
                      <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors group/item">
                        <User className="w-3.5 h-3.5 group-hover/item:text-blue-500 transition-colors" />
                        Mi perfil
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors group/item">
                        <Settings className="w-3.5 h-3.5 group-hover/item:rotate-90 transition-transform duration-300" />
                        Configuración
                      </button>
                    </div>

                    <div className="border-t border-gray-100 dark:border-white/[0.06] py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-gray-700 dark:text-white/70 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors group/item"
                      >
                        <LogOut className="w-3.5 h-3.5 group-hover/item:translate-x-0.5 transition-transform duration-200" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Botón menú móvil */}
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="lg:hidden relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
              aria-label="Menú"
            >
              <div className="relative w-4 h-4">
                <Menu
                  className={`absolute inset-0 w-4 h-4 text-gray-700 dark:text-white/70 transition-all duration-300 ${
                    menuAbierto ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                  }`}
                />
                <X
                  className={`absolute inset-0 w-4 h-4 text-gray-700 dark:text-white/70 transition-all duration-300 ${
                    menuAbierto ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        <div
          className={`lg:hidden border-t border-gray-200/60 dark:border-white/[0.06] bg-white/95 dark:bg-[#0a1428]/95 backdrop-blur-2xl overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            menuAbierto ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-3 py-3 space-y-0.5">
            {MENU_ITEMS.map((item, idx) => {
              const activo = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuAbierto(false)}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${
                    menuAbierto ? 'animate-in slide-in-from-left-2 fade-in' : ''
                  } ${
                    activo
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/15 dark:to-indigo-500/15 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={activo ? 2.5 : 2} />
                  {item.label}
                  {activo && (
                    <span className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}