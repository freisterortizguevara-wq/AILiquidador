// app/api/reportes/empresa/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const empresaId = Number(id);

    if (!empresaId || isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID de empresa inválido' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fechaDesde = searchParams.get('fecha_desde');
    const fechaHasta = searchParams.get('fecha_hasta');

    // Datos de la empresa
    const [empresa] = await sql`
      SELECT id, nit, nombre FROM empresas WHERE id = ${empresaId}
    `;

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Incapacidades en el rango de fechas
    let incapacidades;
    if (fechaDesde && fechaHasta) {
      incapacidades = await sql`
        SELECT 
          i.id, i.tipo, i.subtipo, i.estado,
          i.fecha_inicio, i.fecha_fin, i.dias,
          i.dias_liquidables, i.monto_liquidado,
          e.nombre AS empleado_nombre,
          e.numero_identificacion
        FROM incapacidades i
        LEFT JOIN empleados e ON e.id = i.empleado_id
        WHERE i.empresa_id = ${empresaId}
          AND i.fecha_inicio >= ${fechaDesde}
          AND i.fecha_inicio <= ${fechaHasta}
        ORDER BY i.fecha_inicio DESC
      `;
    } else {
      incapacidades = await sql`
        SELECT 
          i.id, i.tipo, i.subtipo, i.estado,
          i.fecha_inicio, i.fecha_fin, i.dias,
          i.dias_liquidables, i.monto_liquidado,
          e.nombre AS empleado_nombre,
          e.numero_identificacion
        FROM incapacidades i
        LEFT JOIN empleados e ON e.id = i.empleado_id
        WHERE i.empresa_id = ${empresaId}
        ORDER BY i.fecha_inicio DESC
      `;
    }

    // Subtotal por tipo (EG, ARL, LM, LP)
    const porTipo: Record<string, { cantidad: number; monto: number }> = {};
    for (const inc of incapacidades) {
      if (!porTipo[inc.tipo]) {
        porTipo[inc.tipo] = { cantidad: 0, monto: 0 };
      }
      porTipo[inc.tipo].cantidad += 1;
      if (inc.estado === 'LIQUIDAR') {
        porTipo[inc.tipo].monto += Number(inc.monto_liquidado || 0);
      }
    }

    // Subtotal por estado
    const porEstado: Record<string, { cantidad: number; monto: number }> = {};
    for (const inc of incapacidades) {
      if (!porEstado[inc.estado]) {
        porEstado[inc.estado] = { cantidad: 0, monto: 0 };
      }
      porEstado[inc.estado].cantidad += 1;
      porEstado[inc.estado].monto += Number(inc.monto_liquidado || 0);
    }

    // Total general
    const totalLiquidado = incapacidades
      .filter((i) => i.estado === 'LIQUIDAR')
      .reduce((sum, i) => sum + Number(i.monto_liquidado || 0), 0);

    return NextResponse.json({
      success: true,
      empresa,
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta,
      },
      resumen: {
        totalIncapacidades: incapacidades.length,
        totalLiquidado,
        porTipo,
        porEstado,
      },
      incapacidades,
    });
  } catch (error) {
    console.error('ERROR GET /api/reportes/empresa/[id]:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}