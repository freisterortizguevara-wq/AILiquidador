// app/api/rag/documentos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generarEmbedding } from '@/lib/embeddings';
import 'pdf-parse/worker'; // Importante: debe ir antes que la librería principal
import { PDFParse } from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const titulo = formData.get('titulo') as string | null;
    const categoria = (formData.get('categoria') as string) || 'normativa';

    if (!file || !titulo) {
      return NextResponse.json(
        { error: 'El archivo PDF y el título son requeridos' },
        { status: 400 }
      );
    }

    // 1. Extraer texto del PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const textoCompleto = pdfData.text;

    if (!textoCompleto || textoCompleto.trim().length === 0) {
      return NextResponse.json(
        { error: 'El PDF no contiene texto legible o está escaneado como imagen.' },
        { status: 400 }
      );
    }

    // 2. Dividir en fragmentos (Chunks) de ~1000 caracteres
    // Esto ayuda a que el RAG sea más preciso al buscar.
    const chunkSize = 1000;
    const chunks: string[] = [];
    for (let i = 0; i < textoCompleto.length; i += chunkSize) {
      chunks.push(textoCompleto.slice(i, i + chunkSize));
    }

    // 3. Procesar cada fragmento
    let exitosos = 0;
    for (let i = 0; i < chunks.length; i++) {
      const fragmento = chunks[i];
      // Título del fragmento: "Título original - Parte X"
      const tituloFragmento = chunks.length > 1 
        ? `${titulo} - Parte ${i + 1}` 
        : titulo;

      try {
        const embedding = await generarEmbedding(`${tituloFragmento}\n\n${fragmento}`, 'document');

        await sql`
          INSERT INTO conocimiento (titulo, contenido, categoria, embedding)
          VALUES (
            ${tituloFragmento}, 
            ${fragmento}, 
            ${categoria}, 
            ${JSON.stringify(embedding)}::vector
          )
        `;
        exitosos++;
      } catch (err) {
        console.error(`Error procesando fragmento ${i + 1}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Documento procesado. Se insertaron ${exitosos} fragmentos en la base de conocimiento.`,
      fragmentos: exitosos,
    });

  } catch (error) {
    console.error('ERROR POST /api/rag/documentos:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al procesar el PDF' },
      { status: 500 }
    );
  }
}

// GET para listar los documentos actuales
export async function GET() {
  try {
    const documentos = await sql`
      SELECT id, titulo, categoria, created_at 
      FROM conocimiento 
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ success: true, documentos });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al cargar documentos' }, { status: 500 });
  }
}

// DELETE para eliminar un documento (o fragmento)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await sql`DELETE FROM conocimiento WHERE id = ${Number(id)}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al eliminar' }, { status: 500 });
  }
}