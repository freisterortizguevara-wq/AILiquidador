// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verificarToken, COOKIE_NAME_SESION } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME_SESION)?.value;

    if (!token) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const sesion = await verificarToken(token);
    if (!sesion) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: sesion.id,
        nombre: sesion.nombre,
        rol: sesion.rol,
        numero_identificacion: sesion.numero_identificacion,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}