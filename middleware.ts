// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verificarToken, COOKIE_NAME_SESION } from '@/lib/auth';

const RUTAS_PUBLICAS = ['/login', '/api/auth/login', '/api/auth/setup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta))) {
    return NextResponse.next();
  }

  // Verificar cookie de sesión
  const token = request.cookies.get(COOKIE_NAME_SESION)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const sesion = await verificarToken(token);
  if (!sesion) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protege todo excepto archivos estáticos y recursos de Next.js
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};