import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generarEmbedding } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, contenido, categoria } = body;

    if (!titulo || !contenido) {
      return NextResponse.json({ error: 'titulo y contenido son requeridos' }, { status: 400 });
    }

    const embedding = await generarEmbedding(`${titulo}\n\n${contenido}`);

    const [registro] = await sql`
      INSERT INTO conocimiento (titulo, contenido, categoria, embedding)
      VALUES (${titulo}, ${contenido}, ${categoria || null}, ${JSON.stringify(embedding)}::vector)
      RETURNING id, titulo
    `;

    return NextResponse.json({ success: true, registro }, { status: 201 });
  } catch (error) {
    console.error('ERROR POST /api/rag/indexar:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}