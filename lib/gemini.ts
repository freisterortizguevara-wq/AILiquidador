// lib/gemini.ts
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Pregunta a Gemini con contexto (usado por el chat RAG).
 */
export async function preguntarGemini(
  pregunta: string,
  contexto: string
): Promise<string> {
  const prompt = `Eres un asistente experto en incapacidades laborales colombianas. 
Responde ÚNICAMENTE basándote en el siguiente contexto. Si la respuesta no está en el contexto, di "No tengo información suficiente para responder eso".

CONTEXTO:
${contexto}

PREGUNTA: ${pregunta}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
  });

  return response.text || 'No se pudo generar respuesta';
}

/**
 * Genera un resumen ejecutivo a partir de datos agregados del reporte.
 */
export async function generarResumenEjecutivo(datos: {
  empresa: string;
  nit: string;
  periodo: string;
  totalIncapacidades: number;
  totalLiquidado: number;
  porTipo: Record<string, { cantidad: number; monto: number }>;
  porEstado: Record<string, { cantidad: number; monto: number }>;
  diasLiquidables: number;
  promedio: number;
}): Promise<string> {
  const tiposFormateados = Object.entries(datos.porTipo)
    .map(([tipo, v]) => `- ${tipo}: ${v.cantidad} incapacidades, ${formatearPeso(v.monto)} liquidados`)
    .join('\n');

  const estadosFormateados = Object.entries(datos.porEstado)
    .map(([estado, v]) => `- ${estado}: ${v.cantidad} casos, ${formatearPeso(v.monto)}`)
    .join('\n');

  const prompt = `Eres un analista experto en gestión de incapacidades laborales colombianas.
Genera un resumen ejecutivo profesional, conciso y claro (máximo 4 párrafos) sobre el siguiente reporte.
Usa lenguaje formal pero directo. Destaca los hallazgos más importantes para el gerente de RRHH.

DATOS DEL REPORTE:
Empresa: ${datos.empresa} (NIT ${datos.nit})
Período: ${datos.periodo}

Resumen general:
- Total incapacidades: ${datos.totalIncapacidades}
- Total liquidado: ${formatearPeso(datos.totalLiquidado)}
- Días liquidables acumulados: ${datos.diasLiquidables}
- Promedio por liquidación: ${formatearPeso(Math.round(datos.promedio))}

Distribución por tipo:
${tiposFormateados}

Distribución por estado:
${estadosFormateados}

INSTRUCCIONES:
1. Comienza con un párrafo de contexto general (qué se analizó y en qué período).
2. En el segundo párrafo destaca los hallazgos clave (tipos más frecuentes, montos, tendencias).
3. En el tercer párrafo menciona los casos que requieren atención (prescritas, sin reconocimiento, revisiones pendientes).
4. Termina con una recomendación accionable para el gerente.

No uses markdown, no uses viñetas, solo párrafos de texto plano.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || 'No se pudo generar el resumen.';
}

function formatearPeso(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
}