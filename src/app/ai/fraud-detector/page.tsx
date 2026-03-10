"use client";
import { useState } from "react";

interface RedFlag {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  quote: string;
  explanation: string;
}

interface FraudAnalysis {
  fraudScore: number;
  riskLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "DANGER";
  isLikelyFraud: boolean;
  redFlags: RedFlag[];
  greenFlags: string[];
  recommendation: "APPLY" | "CAUTION" | "AVOID" | "REPORT";
  summary: string;
  safetyTips: string[];
}

const RISK_STYLES: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  SAFE:   { bg: "bg-green-100", text: "text-green-800", label: "Sicher",   emoji: "✅" },
  LOW:    { bg: "bg-blue-100",  text: "text-blue-800",  label: "Gering",   emoji: "🔵" },
  MEDIUM: { bg: "bg-yellow-100",text: "text-yellow-800",label: "Mittel",   emoji: "⚠️" },
  HIGH:   { bg: "bg-orange-100",text: "text-orange-800",label: "Hoch",     emoji: "🔴" },
  DANGER: { bg: "bg-red-100",   text: "text-red-800",   label: "Gefährlich",emoji: "🚨" },
};

const RECOMMENDATION_STYLES: Record<string, { color: string; label: string }> = {
  APPLY:   { color: "bg-green-600",  label: "✅ Bewerben" },
  CAUTION: { color: "bg-yellow-500", label: "⚠️ Mit Vorsicht" },
  AVOID:   { color: "bg-red-500",    label: "❌ Vermeiden" },
  REPORT:  { color: "bg-purple-600", label: "🚨 Melden" },
};

export default function FraudDetektorPage() {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudAnalysis | null>(null);
  const [error, setError] = useState("");

  async function analyze() {
    if (text.trim().length < 20) {
      setError("Bitte mindestens 20 Zeichen eingeben.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/fraud-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, url: url || undefined, company: company || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setResult(data.analysis as FraudAnalysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  const riskStyle = result ? (RISK_STYLES[result.riskLevel] ?? RISK_STYLES.MEDIUM) : null;
  const recStyle = result ? (RECOMMENDATION_STYLES[result.recommendation] ?? RECOMMENDATION_STYLES.CAUTION) : null;

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          🚨 Bewerbungs-Fraud-Detektor
        </h1>
        <p className="text-(--muted) mt-2">
          Erkenne gefälschte Stellenanzeigen, Scam-Jobs und betrügerische Angebote bevor du persönliche Daten preisgibst.
        </p>
      </div>

      <div className="bg-(--card) border border-(--border) rounded-xl p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-(--muted) mb-1 block">Firmenname (optional)</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="z.B. Muster GmbH"
              className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-(--muted) mb-1 block">URL der Anzeige (optional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/job/123"
              className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Stellenanzeigen-Text hier einfügen..."
          className="w-full h-48 p-4 bg-(--surface) border border-(--border) rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          id="fraud-detector-input"
          name="fraud-detector-text"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-(--muted)">{text.length} Zeichen</span>
          <button
            onClick={analyze}
            disabled={loading || text.trim().length < 20}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
          >
            {loading ? "⏳ Analysiere..." : "🚨 Auf Betrug prüfen"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">⚠️ {error}</p>}
      </div>

      {result && riskStyle && recStyle && (
        <div className="space-y-6">
          {/* Ergebnis-Header */}
          <div className={`${riskStyle.bg} border rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-70">Betrugs-Risiko</p>
                <h2 className={`text-3xl font-bold ${riskStyle.text}`}>
                  {riskStyle.emoji} {riskStyle.label}
                </h2>
                <p className={`text-sm mt-1 ${riskStyle.text} opacity-80`}>Score: {result.fraudScore}/100</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-70">Empfehlung</p>
                <span className={`inline-block mt-1 px-4 py-2 ${recStyle.color} text-white rounded-lg font-semibold`}>
                  {recStyle.label}
                </span>
              </div>
            </div>
            <p className={`mt-4 text-sm ${riskStyle.text}`}>{result.summary}</p>
          </div>

          {/* Red Flags */}
          {result.redFlags?.length > 0 && (
            <div className="bg-(--card) border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-600 mb-4">🚩 Warnsignale ({result.redFlags.length})</h3>
              <div className="space-y-3">
                {result.redFlags.map((flag, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                    <span className="text-red-500 text-lg flex-shrink-0">
                      {flag.severity === "CRITICAL" ? "🚨" : flag.severity === "HIGH" ? "🔴" : "⚠️"}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-red-800 dark:text-red-300">{flag.type}</p>
                      {flag.quote && <blockquote className="italic text-xs opacity-70 my-1">&ldquo;{flag.quote}&rdquo;</blockquote>}
                      <p className="text-sm text-red-700 dark:text-red-400">{flag.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Green Flags */}
          {result.greenFlags?.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">✅ Vertrauenswürdige Merkmale</h3>
              <ul className="space-y-1">
                {result.greenFlags.map((flag, i) => (
                  <li key={i} className="text-sm text-green-700 dark:text-green-400">• {flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Tips */}
          {result.safetyTips?.length > 0 && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">🛡️ Sicherheitstipps</h3>
              <ul className="space-y-2">
                {result.safetyTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-(--muted)">
                    <span className="text-blue-500 mt-0.5">💡</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
