/**
 * JWT-Hilfsfunktionen – jose (Edge-Runtime-kompatibel)
 * Token läuft nach 7 Tagen ab und wird als HttpOnly-Cookie gespeichert.
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "bw_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 Tage in Sekunden

function secret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) throw new Error("JWT_SECRET ist nicht gesetzt!");
  return new TextEncoder().encode(raw);
}

export interface JWTPayload {
  sub: string;   // userId
  email: string;
  name: string;
  role: string;
}

/** Token signieren */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

/** Token verifizieren und Payload zurückgeben */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** Session-Token aus Cookie lesen und verifizieren */
export async function getSessionFromCookie(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Cookie-Name exportieren (für API-Routes) */
export { COOKIE_NAME, MAX_AGE };
