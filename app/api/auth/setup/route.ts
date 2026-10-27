// app/api/auth/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashearPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Solo funciona si NO hay usuarios registrados
    const [{ count }] = await sql`SELECT COUNT(*) AS count FROM usuarios`;

    if (Number(count) > 0) {
      return NextResponse.json(
        { error: 'Ya existen usuarios. Este endpoint está deshabilitado.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { numero_identificacion, nombre, password, email } = body;

    if (!numero_identificacion || !nombre || !password) {
      return NextResponse.json(
        { error: 'numero_identificacion, nombre y password son requeridos' },
        { status: 400 }
      );
    }

    const password_hash = await hashearPassword(password);

    const [usuario] = await sql`
      INSERT INTO usuarios (numero_identificacion, nombre, email, password_hash, rol)
      VALUES (${numero_identificacion}, ${nombre}, ${email ?? null}, ${password_hash}, 'ADMIN')
      RETURNING id, numero_identificacion, nombre, rol
    `;

    return NextResponse.json({ success: true, usuario }, { status: 201 });
  } catch (error) {
    console.error('ERROR POST /api/auth/setup:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}