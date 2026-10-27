// lib/auth.ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cambiar-esta-clave-en-produccion-minimo-32-chars'
);

const COOKIE_NAME = 'sesion_incapacidades';
const DURACION_HORAS = 8;

export interface SesionUsuario {
  id: number;
  numero_identificacion: string;
  nombre: string;
  rol: 'ADMIN' | 'ANALISTA' | 'AUXILIAR';
}

export async function hashearPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verificarPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function crearToken(usuario: SesionUsuario): Promise<string> {
  return new SignJWT({ ...usuario })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${DURACION_HORAS}h`)
    .sign(JWT_SECRET);
}

export async function verificarToken(
  token: string
): Promise<SesionUsuario | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SesionUsuario;
  } catch {
    return null;
  }
}

export const COOKIE_NAME_SESION = COOKIE_NAME;