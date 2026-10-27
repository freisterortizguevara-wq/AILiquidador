// app/api/ia/resumen-ejecutivo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generarResumenEjecutivo } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.empresa || !body.resumen) {
      return NextResponse.json(
        { error: 'empresa y resumen son requeridos' },
        { status: 400 }
      );
    }

    const { empresa, resumen, periodo } = body;

    const texto = await generarResumenEjecutivo({
      empresa: empresa.nombre,
      nit: empresa.nit,
      periodo: periodo || 'Todos los registros',
      totalIncapacidades: resumen.totalIncapacidades,
      totalLiquidado: resumen.totalLiquidado,
      porTipo: resumen.porTipo,
      porEstado: resumen.porEstado,
      diasLiquidables: body.diasLiquidables || 0,
      promedio: body.promedio || 0,
    });

    return NextResponse.json({
      success: true,
      resumen: texto,
      modelo: 'gemini-2.5-flash',
    });
  } catch (error) {
    console.error('ERROR POST /api/ia/resumen-ejecutivo:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: mensaje },
      { status: 500 }
    );
  }
}