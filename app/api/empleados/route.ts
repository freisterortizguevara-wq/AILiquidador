// app/api/empleados/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresa_id');

    const empleados = empresaId
      ? await sql`
          SELECT id, empresa_id, numero_identificacion, nombre, ibc, fecha_ingreso
          FROM empleados
          WHERE empresa_id = ${Number(empresaId)}
          ORDER BY nombre
        `
      : await sql`
          SELECT id, empresa_id, numero_identificacion, nombre, ibc, fecha_ingreso
          FROM empleados
          ORDER BY nombre
        `;

    return NextResponse.json({ success: true, empleados });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.empresa_id || !body.numero_identificacion || !body.nombre) {
      return NextResponse.json(
        { error: 'empresa_id, numero_identificacion y nombre son requeridos' },
        { status: 400 }
      );
    }

    const [empleado] = await sql`
      INSERT INTO empleados (empresa_id, numero_identificacion, nombre, ibc, fecha_ingreso)
      VALUES (
        ${body.empresa_id},
        ${body.numero_identificacion},
        ${body.nombre},
        ${body.ibc ?? null},
        ${body.fecha_ingreso ?? null}
      )
      RETURNING id, empresa_id, numero_identificacion, nombre, ibc, fecha_ingreso
    `;

    return NextResponse.json({ success: true, empleado }, { status: 201 });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}
