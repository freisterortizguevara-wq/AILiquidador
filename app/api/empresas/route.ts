// app/api/empresas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET: listar todas las empresas
export async function GET() {
  try {
    const empresas = await sql`
      SELECT id, nit, nombre, created_at
      FROM empresas
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ success: true, empresas });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}

// POST: crear una nueva empresa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nit || !body.nombre) {
      return NextResponse.json(
        { error: 'nit y nombre son requeridos' },
        { status: 400 }
      );
    }

    const [empresa] = await sql`
      INSERT INTO empresas (nit, nombre)
      VALUES (${body.nit}, ${body.nombre})
      RETURNING id, nit, nombre, created_at
    `;

    return NextResponse.json({ success: true, empresa }, { status: 201 });
    } catch (error) {
    console.error('ERROR POST /api/empresas:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}