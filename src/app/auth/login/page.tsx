"use client";
import { useState, FormEvent, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, KeyIcon, FingerPrintIcon } from "@heroicons/react/24/outline";
import { startAuthentication } from "@simplewebauthn/browser";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // MFA-Zweiter-Schritt
  const [mfaRequired, setMfaRequired] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const totpInputRef = useRef<HTMLInputElement>(null);

  // WebAuthn Login
  const [webauthnMode, setWebauthnMode] = useState(false);
  const [webauthnEmail, setWebauthnEmail] = useState("");
  const [webauthnLoading, setWebauthnLoading] = useState(false);
  const [webauthnError, setWebauthnError] = useState("");

  // WebAuthn-Login
  async function handleWebAuthnLogin(e: FormEvent) {
    e.preventDefault();
    setWebauthnError("");
    setWebauthnLoading(true);
    try {
      // 1. Optionen holen (mit E-Mail)
      const optRes = await fetch("/api/auth/webauthn/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: webauthnEmail }),
      });
      if (!optRes.ok) {
        const d = await optRes.json();
        throw new Error(d.error ?? "Keine registrierten Geräte gefunden.");
      }
      const options = await optRes.json();

      // 2. Browser-Authentikator aufrufen
      let authResp;
      try {
        authResp = await startAuthentication({ optionsJSON: options });
      } catch (e: any) {
        if (e?.name === "NotAllowedError") throw new Error("Abgebrochen oder kein Gerät verfügbar.");
        throw e;
      }

      // 3. Antwort verifizieren
      const verRes = await fetch("/api/auth/webauthn/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: webauthnEmail, response: authResp }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.error ?? "Authentifizierung fehlgeschlagen");

      router.replace(redirectTo);
      router.refresh();
    } catch (e: any) {
      setWebauthnError(e.message ?? "Unbekannter Fehler");
    } finally {
      setWebauthnLoading(false);
    }
  }

  // Schritt 1: Passwortanmeldung
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen.");
      } else if (data.mfaRequired) {
        // MFA aktiv → zum zweiten Schritt wechseln
        setMfaRequired(true);
        setTimeout(() => totpInputRef.current?.focus(), 100);
      } else {
        router.replace(redirectTo);
        router.refresh();
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  // Schritt 2: TOTP / Backup-Code verifizieren
  async function handleMfaSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = useBackupCode ? { backupCode } : { totpCode };
      const res = await fetch("/api/auth/mfa/login-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ungültiger Code.");
      } else {
        router.replace(redirectTo);
        router.refresh();
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-950 via-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Titel */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">BW-Manage</h1>
          <p className="text-slate-400 text-sm mt-1">Dein Bewerbungsmanagement</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8">

          {/* ─── MFA-Zweiter-Schritt ──────────────────────────────────────── */}
          {mfaRequired ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/20">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Zwei-Faktor-Authentifizierung</h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {useBackupCode ? "Gib einen deiner Backup-Codes ein" : "Öffne deine Authenticator-App"}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                {!useBackupCode ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">6-stelliger Code</label>
                    <input
                      ref={totpInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                      required
                      placeholder="123456"
                      autoComplete="one-time-code"
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-2xl tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Backup-Code</label>
                    <input
                      type="text"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                      required
                      placeholder="XXXXX-XXXXX"
                      className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-lg tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!useBackupCode && totpCode.length !== 6)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Prüfen…
                    </span>
                  ) : "Bestätigen"}
                </button>
              </form>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => { setUseBackupCode(!useBackupCode); setError(""); setTotpCode(""); setBackupCode(""); }}
                  className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition"
                >
                  <KeyIcon className="w-4 h-4" />
                  {useBackupCode ? "Zurück zum Authenticator-Code" : "Backup-Code verwenden"}
                </button>
                <button
                  type="button"
                  onClick={() => { setMfaRequired(false); setError(""); setTotpCode(""); setBackupCode(""); }}
                  className="text-sm text-slate-500 hover:text-slate-400 transition"
                >
                  ← Zurück zur Anmeldung
                </button>
              </div>
            </>
          ) : (
            /* ─── Normaler Login ────────────────────────────────────────── */
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Anmelden</h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">E-Mail-Adresse</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="deine@email.de"
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Passwort</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                      aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Anmelden…
                    </span>
                  ) : "Anmelden"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6">
                Noch kein Konto?{" "}
                <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium transition">
                  Jetzt registrieren
                </Link>
              </p>

              {/* WebAuthn-Trenner */}
              {!webauthnMode && (
                <>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-slate-700" />
                    <span className="text-xs text-slate-500">oder</span>
                    <div className="flex-1 h-px bg-slate-700" />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setWebauthnMode(true); setWebauthnError(""); setWebauthnEmail(email); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition"
                  >
                    <FingerPrintIcon className="w-5 h-5 text-blue-400" />
                    Mit Fingerabdruck / Sicherheitsschlüssel anmelden
                  </button>
                </>
              )}

              {webauthnMode && (
                <div className="mt-4 p-4 rounded-xl bg-slate-700/50 border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <FingerPrintIcon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-slate-200">Biometrische Anmeldung</span>
                  </div>

                  {webauthnError && (
                    <div className="mb-3 p-2.5 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-xs">
                      {webauthnError}
                    </div>
                  )}

                  <form onSubmit={handleWebAuthnLogin} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">E-Mail-Adresse</label>
                      <input
                        type="email"
                        value={webauthnEmail}
                        onChange={(e) => setWebauthnEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="deine@email.de"
                        className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={webauthnLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition"
                      >
                        <FingerPrintIcon className="w-4 h-4" />
                        {webauthnLoading ? "Bitte Gerät bestätigen…" : "Anmelden"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setWebauthnMode(false); setWebauthnError(""); }}
                        className="px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-300 text-sm transition"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6" suppressHydrationWarning>
          © {new Date().getFullYear()} BW-Manage · Alle Daten bleiben auf deinem Server.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-linear-to-br from-blue-950 via-slate-900 to-slate-800" />}>
      <LoginPageContent />
    </Suspense>
  );
}
