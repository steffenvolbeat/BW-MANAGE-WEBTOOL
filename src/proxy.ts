import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";

function buildCsp(isDev: boolean): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:"
    : "script-src 'self' 'unsafe-inline' https://vercel.live";

  const connectSrc = isDev
    ? "connect-src 'self' ws://localhost:* ws://127.0.0.1:* https://raw.githack.com https://market-assets.fra1.cdn.digitaloceanspaces.com https://*.readyplayer.me"
    : "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com";

  const parts = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${isDev ? " https://*.readyplayer.me" : ""}`,
    "font-src 'self' data:",
    connectSrc,
    "media-src 'self' blob:",
    ...(isDev ? ["frame-src https://*.readyplayer.me"] : ["frame-src https://vercel.live"]),
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    ...(!isDev ? ["upgrade-insecure-requests"] : []),
  ];
  return parts.join("; ");
}

// Öffentliche Pfade ohne Login
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/me",
  // WebAuthn Login (kein Session-Cookie erforderlich)
  "/api/auth/webauthn/login-options",
  "/api/auth/webauthn/login-verify",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/workers") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg")
  );
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Statische Assets: nur Security-Header setzen
  if (isAsset(pathname)) {
    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  // Öffentliche Auth-Seiten
  if (isPublic(pathname)) {
    // Eingeloggte User auf Dashboard weiterleiten
    if (pathname === "/auth/login" || pathname === "/auth/register") {
      const token = req.cookies.get(COOKIE_NAME)?.value;
      if (token) {
        const payload = await verifyToken(token);
        if (payload) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Geschützte Routen: JWT prüfen
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }

  // Hinweis: Rollen werden NICHT im Proxy geprüft, da JWT veraltet sein kann
  // (Rolle in DB geändert ohne Re-Login). Alle Admin-Routen prüfen via
  // requireAdmin() → getCurrentUser() → DB. Seiten prüfen via useAuth() → /api/auth/me → DB.

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  res.headers.set("Content-Security-Policy", buildCsp(isDev));
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
