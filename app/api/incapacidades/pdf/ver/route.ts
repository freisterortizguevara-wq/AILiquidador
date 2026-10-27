// app/api/incapacidades/pdf/ver/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { verificarToken, COOKIE_NAME_SESION } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar sesión (los PDFs son privados)
    const token = request.cookies.get(COOKIE_NAME_SESION)?.value;
    if (!token || !(await verificarToken(token))) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Falta el parámetro url' },
        { status: 400 }
      );
    }

    // Obtener el archivo desde Vercel Blob
    const resultado = await get(url, { access: 'private' });

    if (!resultado || !resultado.stream) {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      );
    }

    // Convertir stream a buffer
    const reader = resultado.stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('ERROR GET /api/incapacidades/pdf/ver:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: mensaje },
      { status: 500 }
    );
  }
}