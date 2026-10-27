// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import {
  verificarPassword,
  crearToken,
  COOKIE_NAME_SESION,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numero_identificacion, password } = body;

    if (!numero_identificacion || !password) {
      return NextResponse.json(
        { error: 'Identificación y contraseña son requeridas' },
        { status: 400 }
      );
    }

    const [usuario] = await sql`
      SELECT id, numero_identificacion, nombre, email, password_hash, rol, activo
      FROM usuarios
      WHERE numero_identificacion = ${numero_identificacion}
    `;

    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!usuario.activo) {
      return NextResponse.json(
        { error: 'Usuario inactivo. Contacte al administrador.' },
        { status: 403 }
      );
    }

    const passwordValida = await verificarPassword(password, usuario.password_hash);
    if (!passwordValida) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const token = await crearToken({
      id: usuario.id,
      numero_identificacion: usuario.numero_identificacion,
      nombre: usuario.nombre,
      rol: usuario.rol,
    });

    const response = NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });

    response.cookies.set(COOKIE_NAME_SESION, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('ERROR POST /api/auth/login:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}