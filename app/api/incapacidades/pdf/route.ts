// app/api/incapacidades/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const identificacion = formData.get('identificacion') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Solo se aceptan archivos PDF' },
        { status: 400 }
      );
    }

    // Generar nombre único: incapacidad-{identificacion}-{timestamp}.pdf
    const timestamp = Date.now();
    const identificacionLimpia = (identificacion || 'sin-cc').replace(/\s+/g, '-');
    const nombreArchivo = `incapacidades/${identificacionLimpia}-${timestamp}.pdf`;

    // Subir a Vercel Blob (privado)
    const blob = await put(nombreArchivo, file, {
      access: 'private',
      contentType: 'application/pdf',
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('ERROR POST /api/incapacidades/pdf:', error);
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: mensaje },
      { status: 500 }
    );
  }
}