"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  QrCodeIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  ArrowLeftIcon,
  FingerPrintIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { startRegistration } from "@simplewebauthn/browser";

type Step = "idle" | "setup_qr" | "setup_verify" | "setup_done" | "disable_confirm";

interface WebAuthnCredential {
  id: string;
  name: string;
  deviceType: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface SetupData {
  qrCode: string;
  encryptedSecret: string;
  uri: string;
}

export default function SecurityPage() {
  const router = useRouter();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("idle");
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [totpInput, setTotpInput] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // WebAuthn
  const [webauthnCredentials, setWebauthnCredentials] = useState<WebAuthnCredential[]>([]);
  const [webauthnLoading, setWebauthnLoading] = useState(true);
  const [webauthnError, setWebauthnError] = useState("");
  const [addingDevice, setAddingDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // MFA-Status laden
  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data) => {
        setMfaEnabled(!!data.mfaEnabled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // WebAuthn-Credentials laden
  async function loadWebAuthnCredentials() {
    setWebauthnLoading(true);
    try {
      const res = await fetch("/api/auth/webauthn/credentials");
      if (res.ok) {
        setWebauthnCredentials(await res.json());
      }
    } catch {
      /* ignorieren */
    } finally {
      setWebauthnLoading(false);
    }
  }

  useEffect(() => { loadWebAuthnCredentials(); }, []);

  // Neues WebAuthn-Gerät registrieren
  async function registerDevice() {
    setWebauthnError("");
    setAddingDevice(true);
    try {
      // 1. Optionen vom Server holen
      const optRes = await fetch("/api/auth/webauthn/register-options");
      if (!optRes.ok) throw new Error("Optionen konnten nicht geladen werden");
      const options = await optRes.json();

      // 2. Browser-Authentikator aufrufen
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (e: any) {
        if (e?.name === "NotAllowedError") {
          setWebauthnError("Abgebrochen oder kein kompatibles Gerät gefunden.");
          return;
        }
        throw e;
      }

      // 3. Antwort an Server senden
      const verRes = await fetch("/api/auth/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attResp, name: newDeviceName.trim() || "Gerät" }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.error ?? "Verifikation fehlgeschlagen");

      setNewDeviceName("");
      await loadWebAuthnCredentials();
    } catch (e: any) {
      setWebauthnError(e.message ?? "Unbekannter Fehler");
    } finally {
      setAddingDevice(false);
    }
  }

  // WebAuthn-Gerät löschen
  async function deleteDevice(credId: string) {
    setWebauthnError("");
    try {
      const res = await fetch(`/api/auth/webauthn/credential/${credId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      await loadWebAuthnCredentials();
    } catch (e: any) {
      setWebauthnError(e.message ?? "Fehler beim Löschen");
    }
  }

  // WebAuthn-Gerät umbenennen
  async function renameDevice(credId: string) {
    if (!renameValue.trim()) return;
    setWebauthnError("");
    try {
      const res = await fetch(`/api/auth/webauthn/credential/${credId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (!res.ok) throw new Error("Umbenennen fehlgeschlagen");
      setRenamingId(null);
      await loadWebAuthnCredentials();
    } catch (e: any) {
      setWebauthnError(e.message ?? "Fehler beim Umbenennen");
    }
  }

  // QR-Code laden (MFA-Setup starten)
  async function startSetup() {
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup");
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data: SetupData = await res.json();
      setSetupData(data);
      setStep("setup_qr");
    } catch {
      setError("Setup konnte nicht gestartet werden.");
    } finally {
      setActionLoading(false);
    }
  }

  // Setup bestätigen (Code verifizieren + speichern)
  async function confirmSetup() {
    if (!setupData || totpInput.length !== 6) return;
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedSecret: setupData.encryptedSecret, totpCode: totpInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ungültiger Code.");
        return;
      }
      setBackupCodes(data.backupCodes || []);
      setMfaEnabled(true);
      setStep("setup_done");
    } catch {
      setError("Fehler beim Speichern.");
    } finally {
      setActionLoading(false);
    }
  }

  // MFA deaktivieren
  async function disableMfa() {
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ungültiger Code.");
        return;
      }
      setMfaEnabled(false);
      setStep("idle");
      setDisableCode("");
    } catch {
      setError("Fehler beim Deaktivieren.");
    } finally {
      setActionLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/profile" className="flex items-center gap-1.5 text-sm text-(--muted) hover:text-foreground transition">
              <ArrowLeftIcon className="w-4 h-4" />
              Profil
            </Link>
            <span className="text-(--muted)">/</span>
            <span className="text-sm text-foreground font-medium">Sicherheit</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Sicherheitseinstellungen</h1>
          <p className="text-(--muted) text-sm mb-8">Verwalte die Sicherheit deines Kontos.</p>

          {/* MFA-Karte */}
          <div className="bg-(--card) border border-(--border) rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${mfaEnabled ? "bg-green-500/15" : "bg-(--surface)"}`}>
                  {mfaEnabled ? (
                    <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ShieldExclamationIcon className="w-5 h-5 text-(--muted)" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">Zwei-Faktor-Authentifizierung (2FA)</h2>
                  <p className="text-sm text-(--muted) mt-0.5">
                    Schütze dein Konto mit Google Authenticator, Authy oder einer anderen TOTP-App.
                  </p>
                  {loading ? null : (
                    <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${mfaEnabled ? "bg-green-500/15 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>
                      {mfaEnabled ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
                      {mfaEnabled ? "Aktiv" : "Nicht aktiv"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* ── Schritt: Idle ─────────────────────────────────────── */}
            {step === "idle" && !loading && (
              <>
                {!mfaEnabled ? (
                  <button
                    onClick={startSetup}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    {actionLoading ? "Laden…" : "2FA einrichten"}
                  </button>
                ) : (
                  <button
                    onClick={() => { setStep("disable_confirm"); setError(""); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-medium transition"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    2FA deaktivieren
                  </button>
                )}
              </>
            )}

            {/* ── Schritt: QR-Code anzeigen ──────────────────────────── */}
            {step === "setup_qr" && setupData && (
              <div className="space-y-5">
                <p className="text-sm text-(--muted)">
                  Scanne den QR-Code mit deiner Authenticator-App (z.B. <strong className="text-foreground">Google Authenticator</strong> oder <strong className="text-foreground">Authy</strong>).
                </p>

                <div className="flex flex-col items-center gap-4">
                  {/* QR-Code */}
                  <div className="rounded-2xl p-3 bg-white border border-(--border) shadow-sm">
                    <img src={setupData.qrCode} alt="TOTP QR-Code" className="w-48 h-48" />
                  </div>

                  {/* Manuelle Eingabe */}
                  <div className="w-full">
                    <p className="text-xs text-(--muted) mb-2 text-center">Oder manuell eingeben:</p>
                    <div className="flex items-center gap-2 bg-(--surface) border border-(--border) rounded-lg px-3 py-2">
                      <code className="text-xs text-foreground font-mono flex-1 break-all text-center">
                        {setupData.uri.match(/secret=([^&]+)/)?.[1] ?? ""}
                      </code>
                      <button
                        onClick={() => copyToClipboard(setupData.uri.match(/secret=([^&]+)/)?.[1] ?? "")}
                        className="shrink-0 text-(--muted) hover:text-foreground transition"
                        title="Kopieren"
                      >
                        {copied ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Bestätigung: Code aus der App eingeben</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={totpInput}
                    onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-stelliger Code"
                    className="w-full px-4 py-2.5 rounded-lg bg-(--surface) border border-(--border) text-foreground text-center text-xl tracking-widest placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={confirmSetup}
                    disabled={actionLoading || totpInput.length !== 6}
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition"
                  >
                    {actionLoading ? "Prüfen…" : "Aktivieren"}
                  </button>
                  <button
                    onClick={() => { setStep("idle"); setSetupData(null); setTotpInput(""); setError(""); }}
                    className="px-4 py-2.5 rounded-lg bg-(--surface) border border-(--border) text-(--muted) hover:text-foreground text-sm transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* ── Schritt: Setup fertig (Backup-Codes anzeigen) ─────── */}
            {step === "setup_done" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="font-medium text-sm">2FA erfolgreich aktiviert!</span>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <KeyIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-400">Backup-Codes – jetzt speichern!</p>
                      <p className="text-xs text-amber-500/80 mt-0.5">
                        Diese Codes können nur einmal verwendet werden und werden nicht erneut angezeigt. Bewahre sie sicher auf.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {backupCodes.map((code, i) => (
                      <code key={i} className="text-center bg-(--surface) border border-(--border) rounded-lg px-3 py-1.5 text-sm font-mono text-foreground">
                        {code}
                      </code>
                    ))}
                  </div>
                  <button
                    onClick={() => copyToClipboard(backupCodes.join("\n"))}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition"
                  >
                    {copied ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
                    {copied ? "Kopiert!" : "Alle kopieren"}
                  </button>
                </div>

                <button
                  onClick={() => { setStep("idle"); setBackupCodes([]); }}
                  className="w-full py-2.5 rounded-lg bg-(--surface) border border-(--border) text-foreground text-sm font-medium hover:border-blue-500 transition"
                >
                  Fertig
                </button>
              </div>
            )}

            {/* ── Schritt: 2FA deaktivieren ──────────────────────────── */}
            {step === "disable_confirm" && (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                  Gib deinen aktuellen Authenticator-Code ein, um 2FA zu deaktivieren.
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Authenticator-Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-stelliger Code"
                    className="w-full px-4 py-2.5 rounded-lg bg-(--surface) border border-(--border) text-foreground text-center text-xl tracking-widest placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={disableMfa}
                    disabled={actionLoading || disableCode.length !== 6}
                    className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition"
                  >
                    {actionLoading ? "Deaktivieren…" : "2FA deaktivieren"}
                  </button>
                  <button
                    onClick={() => { setStep("idle"); setDisableCode(""); setError(""); }}
                    className="px-4 py-2.5 rounded-lg bg-(--surface) border border-(--border) text-(--muted) hover:text-foreground text-sm transition"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* ─── WebAuthn / Biometrie-Karte ─────────────────────────── */}
          <div className="bg-(--card) border border-(--border) rounded-2xl p-6 mt-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-(--surface)">
                <FingerPrintIcon className="w-5 h-5 text-(--muted)" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Biometrie &amp; Sicherheitsschlüssel</h2>
                <p className="text-sm text-(--muted) mt-0.5">
                  Melde dich per Fingerabdruck, Face ID oder Hardware-Key an (WebAuthn / FIDO2).
                </p>
              </div>
            </div>

            {webauthnError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {webauthnError}
              </div>
            )}

            {/* Geräteliste */}
            {webauthnLoading ? (
              <p className="text-sm text-(--muted)">Lade Geräte…</p>
            ) : webauthnCredentials.length === 0 ? (
              <p className="text-sm text-(--muted) mb-4">Noch kein Gerät registriert.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {webauthnCredentials.map((cred) => (
                  <li key={cred.id} className="flex items-center gap-3 p-3 rounded-xl bg-(--surface) border border-(--border)">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-(--muted) shrink-0" />
                    <div className="flex-1 min-w-0">
                      {renamingId === cred.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") renameDevice(cred.id); if (e.key === "Escape") setRenamingId(null); }}
                            className="flex-1 px-2 py-1 rounded-lg bg-(--card) border border-(--border) text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button onClick={() => renameDevice(cred.id)} className="text-xs text-blue-400 hover:text-blue-300">OK</button>
                          <button onClick={() => setRenamingId(null)} className="text-xs text-(--muted) hover:text-foreground">Abbrechen</button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-foreground truncate">{cred.name}</p>
                          <p className="text-xs text-(--muted)">
                            Hinzugefügt {new Date(cred.createdAt).toLocaleDateString("de")} · Zuletzt verwendet{" "}
                            {cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleDateString("de") : "nie"}
                          </p>
                        </>
                      )}
                    </div>
                    {renamingId !== cred.id && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => { setRenamingId(cred.id); setRenameValue(cred.name); }}
                          className="p-1.5 rounded-lg text-(--muted) hover:text-foreground hover:bg-(--card) transition"
                          title="Umbenennen"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteDevice(cred.id)}
                          className="p-1.5 rounded-lg text-(--muted) hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Entfernen"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Neues Gerät hinzufügen */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Gerätename (optional)"
                className="flex-1 px-3 py-2 rounded-lg bg-(--surface) border border-(--border) text-sm text-foreground placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                onKeyDown={(e) => { if (e.key === "Enter") registerDevice(); }}
              />
              <button
                onClick={registerDevice}
                disabled={addingDevice}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition shrink-0"
              >
                <PlusIcon className="w-4 h-4" />
                {addingDevice ? "Registrieren…" : "Gerät hinzufügen"}
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
