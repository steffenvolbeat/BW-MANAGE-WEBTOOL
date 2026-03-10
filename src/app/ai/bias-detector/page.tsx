"use client";
import { useState } from "react";

type BiasType = "GENDER_BIAS" | "AGE_BIAS" | "ORIGIN_BIAS" | "QUALIFICATION_BIAS" | "CULTURE_BIAS";
type Severity = "LOW" | "MEDIUM" | "HIGH";

interface BiasIssue {
  type: BiasType;
  severity: Severity;
  quote: string;
  suggestion: string;
  explanation: string;
}

interface BiasAnalysis {
  overallScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  issues: BiasIssue[];
  strengths: string[];
  summary: string;
  improvedVersion?: string;
}

const TYPE_LABELS: Record<string, string> = {
  job_posting: "Stellenanzeige",
  cover_letter: "Anschreiben",
  cv: "Lebenslauf",
};

const SEVERITY_COLOR: Record<string, string> = {
  LOW: "bg-yellow-100 text-yellow-800 border-yellow-300",
  MEDIUM: "bg-orange-100 text-orange-800 border-orange-300",
  HIGH: "bg-red-100 text-red-800 border-red-300",
};

const RISK_COLOR: Record<string, string> = {
  LOW: "text-green-600",
  MEDIUM: "text-orange-500",
  HIGH: "text-red-600",
};

export default function BiasDetektorPage() {
  const [text, setText] = useState("");
  const [type, setType] = useState<"job_posting" | "cover_letter" | "cv">("job_posting");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BiasAnalysis | null>(null);
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
      const res = await fetch("/api/ai/bias-detector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setResult(data.analysis as BiasAnalysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          🔍 Echtzeit-Bias-Detektor
        </h1>
        <p className="text-(--muted) mt-2">
          Analysiere Stellenanzeigen, Anschreiben oder Lebensläufe auf potenzielle Diskriminierung und Bias.
          KI-gestützte Erkennung von Alters-, Gender-, Herkunfts- und Qualifikations-Bias.
        </p>
      </div>

      <div className="bg-(--card) border border-(--border) rounded-xl p-6 mb-6">
        {/* Typ-Auswahl */}
        <div className="flex gap-3 mb-4">
          {(["job_posting", "cover_letter", "cv"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                type === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-(--surface) border-(--border) hover:border-blue-400"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`${TYPE_LABELS[type]}-Text hier einfügen...`}
          className="w-full h-48 p-4 bg-(--surface) border border-(--border) rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          id="bias-detector-input"
          name="bias-detector-text"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-(--muted)">{text.length} Zeichen</span>
          <button
            onClick={analyze}
            disabled={loading || text.trim().length < 20}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "⏳ Analysiere..." : "🔍 Bias analysieren"}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">⚠️ {error}</p>}
      </div>

      {result && (
        <div className="space-y-6">
          {/* Score-Übersicht */}
          <div className="bg-(--card) border border-(--border) rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Analyseergebnis</h2>
              <span className={`text-2xl font-bold ${RISK_COLOR[result.riskLevel] ?? "text-gray-500"}`}>
                Risiko: {result.riskLevel}
              </span>
            </div>
            {/* Score-Balken */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Fairness-Score</span>
                <span className="font-semibold">{result.overallScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${result.overallScore >= 70 ? "bg-green-500" : result.overallScore >= 40 ? "bg-orange-500" : "bg-red-500"}`}
                  style={{ width: `${result.overallScore}%` }}
                />
              </div>
            </div>
            <p className="text-(--muted) text-sm">{result.summary}</p>
          </div>

          {/* Issues */}
          {result.issues?.length > 0 && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">⚠️ Gefundene Probleme ({result.issues.length})</h3>
              <div className="space-y-4">
                {result.issues.map((issue, i) => (
                  <div key={i} className={`border rounded-lg p-4 ${SEVERITY_COLOR[issue.severity] ?? ""}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">{issue.type.replace("_", " ")}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 font-medium">
                        {issue.severity}
                      </span>
                    </div>
                    <blockquote className="italic text-sm mb-2 border-l-2 pl-3 opacity-80">
                      &ldquo;{issue.quote}&rdquo;
                    </blockquote>
                    <p className="text-sm mb-1">{issue.explanation}</p>
                    <p className="text-sm font-medium">💡 {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stärken */}
          {result.strengths?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 dark:bg-green-900/20">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">✅ Positive Aspekte</h3>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-700 dark:text-green-400">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Verbesserte Version */}
          {result.improvedVersion && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">✨ Verbesserte Version</h3>
              <p className="text-sm text-(--muted) italic bg-(--surface) rounded-lg p-4">
                {result.improvedVersion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
