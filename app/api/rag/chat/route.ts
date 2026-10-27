// app/api/rag/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generarEmbedding } from '@/lib/embeddings';
import { preguntarGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pregunta } = body;

    if (!pregunta) {
      return NextResponse.json(
        { error: 'La pregunta es requerida' },
        { status: 400 }
      );
    }

    // 1. Generar embedding de la pregunta (tipo query)
    const embeddingPregunta = await generarEmbedding(pregunta, 'query');

    // 2. Buscar los 3 fragmentos más relevantes
    const fragmentos = await sql`
      SELECT 
        id,
        titulo,
        contenido,
        1 - (embedding <=> ${JSON.stringify(embeddingPregunta)}::vector) AS similitud
      FROM conocimiento
      WHERE 1 - (embedding <=> ${JSON.stringify(embeddingPregunta)}::vector) > 0.5
      ORDER BY embedding <=> ${JSON.stringify(embeddingPregunta)}::vector
      LIMIT 3
    `;

    // 3. Si no hay contexto relevante, responder directamente
    if (fragmentos.length === 0) {
      const respuesta = await preguntarGemini(pregunta, 'No hay contexto disponible.');
      return NextResponse.json({
        success: true,
        respuesta,
        contexto: [],
      });
    }

    // 4. Construir contexto
    const contexto = fragmentos
      .map((f) => `[${f.titulo}]: ${f.contenido}`)
      .join('\n\n');

    // 5. Generar respuesta con Gemini
    const respuesta = await preguntarGemini(pregunta, contexto);

    return NextResponse.json({
      success: true,
      respuesta,
      contexto: fragmentos.map((f) => ({
        titulo: f.titulo,
        similitud: f.similitud,
      })),
    });
  } catch (error) {
    console.error('ERROR POST /api/rag/chat:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
  }
}