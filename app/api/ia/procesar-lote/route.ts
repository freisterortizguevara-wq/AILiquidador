// app/api/ia/procesar-lote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { liquidar, DatosIncapacidad } from '@/lib/liquidacion';
import Groq from 'groq-sdk';
import pLimit from 'p-limit';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Máximo 3 PDFs en paralelo (para no saturar Groq)
const limit = pLimit(3);

interface ArchivoLote {
  nombre: string;
  imageBase64: string;
  pdfUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { archivos } = body as { archivos: ArchivoLote[] };

    if (!archivos || !Array.isArray(archivos) || archivos.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de archivos' },
        { status: 400 }
      );
    }

    console.log(`📦 Procesando lote de ${archivos.length} PDFs`);

    // Procesar cada archivo con concurrencia limitada
    const resultados = await Promise.all(
      archivos.map((archivo) =>
        limit(async () => {
          try {
            console.log(`🔍 Procesando: ${archivo.nombre}`);

            // 1. Extraer datos con IA
            const extraccion = await extraerDatosConIA(archivo.imageBase64);

            // 2. Validaciones básicas
            if (!extraccion.numero_identificacion) {
              return {
                archivo: archivo.nombre,
                success: false,
                error: 'No se pudo identificar la cédula del empleado',
              };
            }

            if (!extraccion.dias_incapacidad || !extraccion.fecha_inicio) {
              return {
                archivo: archivo.nombre,
                success: false,
                error: 'Faltan datos: días o fecha de inicio',
              };
            }

            // 3. Buscar empleado
            const [empleado] = await sql`
              SELECT id, empresa_id, nombre, ibc, fecha_ingreso
              FROM empleados
              WHERE numero_identificacion = ${extraccion.numero_identificacion}
              LIMIT 1
            `;

            if (!empleado) {
              return {
                archivo: archivo.nombre,
                success: false,
                error: `Empleado no encontrado: ${extraccion.numero_identificacion}`,
                extraccion,
              };
            }

            // 4. Liquidar
            const anio = new Date(extraccion.fecha_inicio).getFullYear();
            const ibcFinal = extraccion.ibc_declarado || empleado.ibc || undefined;

            const datos: DatosIncapacidad = {
              tipo: (extraccion.tipo_prestacion as any) || 'EG',
              subtipo: extraccion.es_prorroga ? 'PRORROGA' : 'NUEVA',
              anio,
              dias: Number(extraccion.dias_incapacidad),
              ibc: ibcFinal,
              fechaInicio: new Date(extraccion.fecha_inicio),
              fechaFin: new Date(
                extraccion.fecha_fin || extraccion.fecha_inicio
              ),
              fechaIngresoEmpleado: empleado.fecha_ingreso
                ? new Date(empleado.fecha_ingreso)
                : undefined,
            };

            const resultado = liquidar(datos);

            // 5. Guardar en base de datos
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
                ${archivo.pdfUrl ?? null},
                ${resultado.estado},
                ${resultado.diasLiquidables},
                ${resultado.monto},
                ${resultado.formula},
                ${resultado.observaciones.join(' | ')}
              )
              RETURNING id
            `;

            console.log(`✅ ${archivo.nombre}: liquidado #${incapacidad.id}`);

            return {
              archivo: archivo.nombre,
              success: true,
              incapacidad_id: incapacidad.id,
              empleado: {
                nombre: empleado.nombre,
                identificacion: extraccion.numero_identificacion,
              },
              liquidacion: resultado,
              extraccion,
            };
          } catch (err) {
            console.error(`❌ Error en ${archivo.nombre}:`, err);
            return {
              archivo: archivo.nombre,
              success: false,
              error: err instanceof Error ? err.message : 'Error desconocido',
            };
          }
        })
      )
    );

    // Resumen
    const exitosos = resultados.filter((r) => r.success).length;
    const fallidos = resultados.filter((r) => !r.success).length;
    const totalLiquidado = resultados
      .filter((r) => r.success && r.liquidacion)
      .reduce((sum, r) => sum + (r.liquidacion?.monto || 0), 0);

    console.log(
      `📊 Resultado: ${exitosos} exitosos, ${fallidos} fallidos, total ${totalLiquidado}`
    );

    return NextResponse.json({
      success: true,
      resumen: {
        total: archivos.length,
        exitosos,
        fallidos,
        totalLiquidado,
      },
      resultados,
    });
  } catch (error) {
    console.error('ERROR POST /api/ia/procesar-lote:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}

async function extraerDatosConIA(imageBase64: string) {
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
  "nombre_empleado": "string",
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