// app/api/ia/procesar-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Se requiere la imagen del PDF en base64' },
        { status: 400 }
      );
    }

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
  "tipo_prestacion": "EG | ARL | LM | LP (Enfermedad General, Accidente Laboral, Licencia Maternidad, Licencia Paternidad)",
  "fecha_inicio": "YYYY-MM-DD",
  "fecha_fin": "YYYY-MM-DD",
  "dias_incapacidad": number (número de días de incapacidad),
  "diagnostico_cie10": "string (código CIE-10 si aparece)",
  "eps_o_arl": "string (nombre de la EPS o ARL que emite)",
  "es_prorroga": boolean (true si dice "prórroga" o "continuación"),
  "ibc_declarado": number o null (IBC si aparece explícitamente)
}

Si algún campo no está claro o no aparece en el documento, devuélvelo como null.
No inventes datos. No calcules liquidaciones. Solo extrae lo que está visible.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const respuesta = completion.choices[0]?.message?.content;

    if (!respuesta) {
      throw new Error('No se recibió respuesta del modelo');
    }

    const datos = JSON.parse(respuesta);

    return NextResponse.json({
      success: true,
      datos,
      modelo: 'qwen/qwen3.8-27b',
    });
  } catch (error) {
    console.error('ERROR POST /api/ia/procesar-pdf:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}