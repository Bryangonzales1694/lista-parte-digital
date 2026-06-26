import "server-only";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
const SESSION_COOKIE = "lpd_session";
const SESSION_DURATION_HOURS = 12;

export type Rol = "seccion" | "compania" | "comandante";

export type SessionPayload = {
  usuarioId: string;
  nombre: string;
  rol: Rol;
  seccionAsignada: string | null;
  companiaAsignada: string | null;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_HOURS * 60 * 60;
