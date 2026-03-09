/**
 * RATE LIMITER – Sliding-Window, In-Memory
 *
 * Algorithmus: Sliding-Window (exakt, nicht approximiert)
 * Schutzebenen:
 *   - IP-basiert   (Brute Force von einer IP)
 *   - Email-basiert (Credential-Stuffing auf ein Konto)
 *   - Account-Lockout (nach N Fehlversuchen, zeitbasiert)
 */

import { NextResponse } from "next/server";

// ─── Typen ─────────────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

// ─── In-Memory Sliding-Window ──────────────────────────────────────────────────

const slidingStore = new Map<string, number[]>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - 10 * 60_000;
    for (const [key, timestamps] of slidingStore.entries()) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) {
        slidingStore.delete(key);
      } else {
        slidingStore.set(key, fresh);
      }
    }
  }, 2 * 60_000);
}

function checkInMemory(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - opts.windowMs;
  const prev = (slidingStore.get(key) ?? []).filter((t) => t > windowStart);
  const count = prev.length;

  if (count >= opts.max) {
    const oldest = prev[0] ?? now;
    const resetAt = oldest + opts.windowMs;
    return { allowed: false, remaining: 0, resetAt, retryAfterMs: resetAt - now };
  }

  prev.push(now);
  slidingStore.set(key, prev);

  return { allowed: true, remaining: opts.max - prev.length, resetAt: now + opts.windowMs, retryAfterMs: 0 };
}

async function checkLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  return checkInMemory(key, opts);
}

// ─── IP-Extraktion ─────────────────────────────────────────────────────────────

export function getClientIp(req: Request): string {
  const h = req.headers as Headers;
  const forwarded = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? h.get("cf-connecting-ip");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}

// ─── Account-Lockout ───────────────────────────────────────────────────────────

interface LockoutEntry {
  failures: number;
  lockedUntil: number;
  lastFailure: number;
}

const lockoutStore = new Map<string, LockoutEntry>();

const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION_MS = 15 * 60_000;

export function checkAccountLockout(key: string): { locked: boolean; unlocksAt: number } {
  const entry = lockoutStore.get(key);
  if (!entry || entry.lockedUntil === 0) return { locked: false, unlocksAt: 0 };

  if (Date.now() > entry.lockedUntil) {
    lockoutStore.delete(key);
    return { locked: false, unlocksAt: 0 };
  }

  return { locked: true, unlocksAt: entry.lockedUntil };
}

export function recordFailedAuth(
  key: string,
  threshold = LOCKOUT_THRESHOLD,
  durationMs = LOCKOUT_DURATION_MS
): { locked: boolean; failures: number; unlocksAt: number } {
  const now = Date.now();
  const entry = lockoutStore.get(key) ?? { failures: 0, lockedUntil: 0, lastFailure: 0 };

  const adjustedFailures =
    now - entry.lastFailure > 5 * 60_000 ? Math.floor(entry.failures / 2) : entry.failures;

  const newFailures = adjustedFailures + 1;
  const willLock = newFailures >= threshold;
  const lockedUntil = willLock ? now + durationMs : 0;

  lockoutStore.set(key, { failures: newFailures, lockedUntil, lastFailure: now });

  return { locked: willLock, failures: newFailures, unlocksAt: lockedUntil };
}

export function clearFailedAuth(key: string): void {
  lockoutStore.delete(key);
}

// ─── Spezialisierte Limiter ────────────────────────────────────────────────────

export async function rateLimitSignin(
  ip: string,
  email: string
): Promise<{ allowed: boolean; reason?: string; retryAfterMs: number }> {
  // Kein IP-Rate-Limit für localhost/unknown (Entwicklungsumgebung)
  const isLocalIp = ip === "unknown" || ip === "::1" || ip === "127.0.0.1";

  if (!isLocalIp) {
    const ipResult = await checkLimit(`signin:ip:${ip}`, { max: 20, windowMs: 60_000 });
    if (!ipResult.allowed) {
      return { allowed: false, reason: "ip", retryAfterMs: ipResult.retryAfterMs };
    }
  }

  const emailResult = await checkLimit(`signin:email:${email.toLowerCase()}`, {
    max: 10,
    windowMs: 5 * 60_000,
  });
  if (!emailResult.allowed) {
    return { allowed: false, reason: "email", retryAfterMs: emailResult.retryAfterMs };
  }

  const lockout = checkAccountLockout(`lockout:${email.toLowerCase()}`);
  if (lockout.locked) {
    return { allowed: false, reason: "lockout", retryAfterMs: lockout.unlocksAt - Date.now() };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function recordFailedSignin(email: string): { locked: boolean; failures: number } {
  return recordFailedAuth(`lockout:${email.toLowerCase()}`, LOCKOUT_THRESHOLD, LOCKOUT_DURATION_MS);
}

// ─── Middleware-Funktion ────────────────────────────────────────────────────────

export function enforceRateLimit(
  req: Request,
  namespace: string,
  options: RateLimitOptions
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${namespace}:${ip}`;
  const result = checkInMemory(key, options);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Zu viele Anfragen. Bitte warte kurz und versuche es erneut.",
        retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
          "X-RateLimit-Limit": String(options.max),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  return null;
}

export function getRateLimitStatus(namespace: string, ip: string, windowMs: number): {
  count: number;
  windowStart: number;
} {
  const key = `${namespace}:${ip}`;
  const now = Date.now();
  const timestamps = (slidingStore.get(key) ?? []).filter((t) => t > now - windowMs);
  return { count: timestamps.length, windowStart: timestamps[0] ?? now };
}
