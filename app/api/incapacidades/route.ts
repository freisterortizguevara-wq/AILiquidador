// app/api/incapacidades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { liquidar, DatosIncapacidad } from '@/lib/liquidacion';

// GET: listar incapacidades con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresa_id');
    const estado = searchParams.get('estado');

    let incapacidades;
    if (empresaId && estado) {
      incapacidades = await sql`
        SELECT i.*, e.nombre AS empleado_nombre, emp.nombre AS empresa_nombre
        FROM incapacidades i
        LEFT JOIN empleados e ON e.id = i.empleado_id
        LEFT JOIN empresas emp ON emp.id = i.empresa_id
        WHERE i.empresa_id = ${Number(empresaId)} AND i.estado = ${estado}
        ORDER BY i.created_at DESC
      `;
    } else if (empresaId) {
      incapacidades = await sql`
        SELECT i.*, e.nombre AS empleado_nombre, emp.nombre AS empresa_nombre
        FROM incapacidades i
        LEFT JOIN empleados e ON e.id = i.empleado_id
        LEFT JOIN empresas emp ON emp.id = i.empresa_id
        WHERE i.empresa_id = ${Number(empresaId)}
        ORDER BY i.created_at DESC
      `;
    } else {
      incapacidades = await sql`
        SELECT i.*, e.nombre AS empleado_nombre, emp.nombre AS empresa_nombre
        FROM incapacidades i
        LEFT JOIN empleados e ON e.id = i.empleado_id
        LEFT JOIN empresas emp ON emp.id = i.empresa_id
        ORDER BY i.created_at DESC
      `;
    }

    return NextResponse.json({ success: true, incapacidades });
  } catch (error) {
    console.error('ERROR GET /api/incapacidades:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}

// POST: crear una incapacidad, liquidarla y guardarla
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validaciones mínimas
    if (!body.empresa_id || !body.empleado_id) {
      return NextResponse.json(
        { error: 'empresa_id y empleado_id son requeridos' },
        { status: 400 }
      );
    }
    if (!body.tipo || !body.subtipo || !body.dias || !body.fecha_inicio || !body.fecha_fin) {
      return NextResponse.json(
        { error: 'tipo, subtipo, dias, fecha_inicio y fecha_fin son requeridos' },
        { status: 400 }
      );
    }

    // Construir datos para el motor de liquidación
    const datos: DatosIncapacidad = {
      tipo: body.tipo,
      subtipo: body.subtipo,
      anio: Number(body.anio) || new Date(body.fecha_inicio).getFullYear(),
      dias: Number(body.dias),
      ibc: body.ibc ? Number(body.ibc) : undefined,
      fechaInicio: new Date(body.fecha_inicio),
      fechaFin: new Date(body.fecha_fin),
      fechaIngresoEmpleado: body.fecha_ingreso_empleado
        ? new Date(body.fecha_ingreso_empleado)
        : undefined,
    };

    // Ejecutar liquidación
    const resultado = liquidar(datos);

    // Guardar en base de datos
    const [incapacidad] = await sql`
      INSERT INTO incapacidades (
        empleado_id, empresa_id, tipo, subtipo, anio,
        fecha_inicio, fecha_fin, dias, ibc,
        diagnostico_cie10, pdf_url,
        estado, dias_liquidables, monto_liquidado, formula, observaciones
      )
      VALUES (
        ${body.empleado_id},
        ${body.empresa_id},
        ${datos.tipo},
        ${datos.subtipo},
        ${datos.anio},
        ${body.fecha_inicio},
        ${body.fecha_fin},
        ${datos.dias},
        ${datos.ibc ?? null},
        ${body.diagnostico_cie10 ?? null},
        ${body.pdf_url ?? null},
        ${resultado.estado},
        ${resultado.diasLiquidables},
        ${resultado.monto},
        ${resultado.formula},
        ${resultado.observaciones.join(' | ')}
      )
      RETURNING *
    `;

    return NextResponse.json(
      { success: true, incapacidad, resultado },
      { status: 201 }
    );
  } catch (error) {
    console.error('ERROR POST /api/incapacidades:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}