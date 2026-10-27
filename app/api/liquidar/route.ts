// app/api/liquidar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  liquidar,
  DatosIncapacidad,
  TipoIncapacidad,
  Subtipo,
} from '@/lib/liquidacion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validación de campos obligatorios
    const camposRequeridos = ['tipo', 'subtipo', 'anio', 'dias', 'fechaInicio', 'fechaFin'];
    for (const campo of camposRequeridos) {
      if (body[campo] === undefined || body[campo] === null) {
        return NextResponse.json(
          { error: `Campo requerido faltante: ${campo}` },
          { status: 400 }
        );
      }
    }

    // Validación de tipo
    const tiposValidos: TipoIncapacidad[] = ['EG', 'ARL', 'LM', 'LP'];
    if (!tiposValidos.includes(body.tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}` },
        { status: 400 }
      );
    }

    // Validación de subtipo
    const subtiposValidos: Subtipo[] = ['NUEVA', 'PRORROGA'];
    if (!subtiposValidos.includes(body.subtipo)) {
      return NextResponse.json(
        { error: `Subtipo inválido. Debe ser uno de: ${subtiposValidos.join(', ')}` },
        { status: 400 }
      );
    }

    // Construcción del objeto de datos
    const datos: DatosIncapacidad = {
      tipo: body.tipo,
      subtipo: body.subtipo,
      anio: Number(body.anio),
      dias: Number(body.dias),
      ibc: body.ibc ? Number(body.ibc) : undefined,
      fechaInicio: new Date(body.fechaInicio),
      fechaFin: new Date(body.fechaFin),
      fechaIngresoEmpleado: body.fechaIngresoEmpleado
        ? new Date(body.fechaIngresoEmpleado)
        : undefined,
    };

    // Ejecutar el motor de liquidación
    const resultado = liquidar(datos);

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      datos_entrada: {
        tipo: datos.tipo,
        subtipo: datos.subtipo,
        anio: datos.anio,
        dias: datos.dias,
        ibc: datos.ibc ?? null,
      },
      resultado,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: mensaje },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar que la API está viva
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    mensaje: 'API de liquidación de incapacidades funcionando',
    endpoint: 'POST /api/liquidar',
    tiposSoportados: ['EG', 'ARL', 'LM', 'LP'],
  });
}