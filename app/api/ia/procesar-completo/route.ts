// app/api/ia/procesar-completo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { liquidar, DatosIncapacidad } from '@/lib/liquidacion';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface ExtraccionIA {
  numero_identificacion: string | null;
  nombre_empleado: string | null;
  tipo_prestacion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias_incapacidad: number | null;
  diagnostico_cie10: string | null;
  eps_o_arl: string | null;
  es_prorroga: boolean | null;
  ibc_declarado: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, pdfUrl } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Se requiere la imagen del PDF' },
        { status: 400 }
      );
    }

    // ============ PASO 1: Extraer datos con IA ============
    const extraccion = await extraerDatosConIA(imageBase64);

    if (!extraccion.numero_identificacion) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo identificar el empleado en el PDF',
          extraccion,
        },
        { status: 400 }
      );
    }

    if (!extraccion.dias_incapacidad || !extraccion.fecha_inicio) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos insuficientes para liquidar (faltan días o fecha)',
          extraccion,
        },
        { status: 400 }
      );
    }

    // ============ PASO 2: Buscar empleado por identificación ============
    const [empleado] = await sql`
      SELECT id, empresa_id, nombre, ibc, fecha_ingreso
      FROM empleados
      WHERE numero_identificacion = ${extraccion.numero_identificacion}
      LIMIT 1
    `;

    if (!empleado) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encontró ningún empleado con identificación ${extraccion.numero_identificacion}. Regístralo primero.`,
          extraccion,
        },
        { status: 404 }
      );
    }

    // ============ PASO 3: Buscar empresa ============
    const [empresa] = await sql`
      SELECT id, nit, nombre
      FROM empresas
      WHERE id = ${empleado.empresa_id}
      LIMIT 1
    `;

    // ============ PASO 4: Construir datos y liquidar ============
    const anio = new Date(extraccion.fecha_inicio).getFullYear();
    const ibcFinal = extraccion.ibc_declarado || empleado.ibc || undefined;

    const datos: DatosIncapacidad = {
      tipo: (extraccion.tipo_prestacion as any) || 'EG',
      subtipo: extraccion.es_prorroga ? 'PRORROGA' : 'NUEVA',
      anio,
      dias: Number(extraccion.dias_incapacidad),
      ibc: ibcFinal,
      fechaInicio: new Date(extraccion.fecha_inicio),
      fechaFin: new Date(extraccion.fecha_fin || extraccion.fecha_inicio),
      fechaIngresoEmpleado: empleado.fecha_ingreso
        ? new Date(empleado.fecha_ingreso)
        : undefined,
    };

    let resultado;
    try {
      resultado = liquidar(datos);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: `Error al liquidar: ${err instanceof Error ? err.message : 'desconocido'}`,
          extraccion,
          empleado: { nombre: empleado.nombre, id: empleado.id },
        },
        { status: 400 }
      );
    }

    // ============ PASO 5: Guardar en base de datos ============
    const [incapacidad] = await sql`
      INSERT INTO incapacidades (
        empleado_id, empresa_id, tipo, subtipo, anio,
        fecha_inicio, fecha_fin, dias, ibc,
        diagnostico_cie10, pdf_url,
        estado, dias_liquidables, monto_liquidado, formula, observaciones
      )
      VALUES (
        ${empleado.id},
        ${empleado.empresa_id},
        ${datos.tipo},
        ${datos.subtipo},
        ${datos.anio},
        ${extraccion.fecha_inicio},
        ${extraccion.fecha_fin || extraccion.fecha_inicio},
        ${datos.dias},
        ${datos.ibc ?? null},
        ${extraccion.diagnostico_cie10 ?? null},
        ${pdfUrl ?? null},
        ${resultado.estado},
        ${resultado.diasLiquidables},
        ${resultado.monto},
        ${resultado.formula},
        ${resultado.observaciones.join(' | ')}
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      incapacidad_id: incapacidad.id,
      extraccion,
      empleado: {
        id: empleado.id,
        nombre: empleado.nombre,
        ibc: empleado.ibc,
      },
      empresa: empresa
        ? { id: empresa.id, nombre: empresa.nombre, nit: empresa.nit }
        : null,
      liquidacion: resultado,
    });
  } catch (error) {
    console.error('ERROR POST /api/ia/procesar-completo:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}

async function extraerDatosConIA(imageBase64: string): Promise<ExtraccionIA> {
  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Eres un asistente especializado en leer incapacidades médicas colombianas.
Extrae del documento la siguiente información y devuélvela ÚNICAMENTE como un objeto JSON válido, sin texto adicional.

{
  "numero_identificacion": "string (número de cédula del paciente)",
  "nombre_empleado": "string (nombre completo del paciente)",
  "tipo_prestacion": "EG | ARL | LM | LP",
  "fecha_inicio": "YYYY-MM-DD",
  "fecha_fin": "YYYY-MM-DD",
  "dias_incapacidad": number,
  "diagnostico_cie10": "string",
  "eps_o_arl": "string",
  "es_prorroga": boolean,
  "ibc_declarado": number o null
}

Si algún campo no está claro, devuélvelo como null. No inventes datos.`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  const contenido = completion.choices[0]?.message?.content;
  if (!contenido) throw new Error('Sin respuesta del modelo');
  return JSON.parse(contenido);
}