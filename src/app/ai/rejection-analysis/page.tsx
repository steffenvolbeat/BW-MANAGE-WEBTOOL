"use client";
import { useState, useEffect } from "react";

interface Pattern {
  type: string;
  description: string;
  affected: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

interface Recommendation {
  priority: "HIGH" | "MEDIUM" | "LOW";
  action: string;
  expectedImpact: string;
}

interface Analysis {
  patterns: Pattern[];
  topIssues: string[];
  successFactors: string[];
  recommendations: Recommendation[];
  predictedOutcome: {
    currentSuccessRate: number;
    improvedSuccessRate: number;
    timeToNextInterview: string;
  };
  summary: string;
}

interface Stats {
  total: number;
  rejected: number;
  successful: number;
  pending: number;
  rejectionRate: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: "border-l-red-400 bg-red-50 dark:bg-red-900/10",
  MEDIUM: "border-l-orange-400 bg-orange-50 dark:bg-orange-900/10",
  LOW: "border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/10",
};

const PRI_BADGE: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-blue-100 text-blue-700",
};

export default function RejectionAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai/rejection-analysis", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setAnalysis(d.insight ?? null);
        setStats(d.stats ?? null);
        setMessage(d.message ?? "");
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--surface)">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🔮</div>
          <p className="text-(--muted)">KI analysiert deine Bewerbungshistorie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">📉 Predictive Rejection Analysis</h1>
        <p className="text-(--muted) mt-2">
          KI analysiert deine Bewerbungshistorie und erkennt Muster in Absagen. 
          Konkrete Handlungsempfehlungen für mehr Erfolg.
        </p>
      </div>

      {/* Stats-Überblick */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Bewerbungen", value: stats.total, color: "text-blue-600" },
            { label: "Erfolgreich", value: stats.successful, color: "text-green-600" },
            { label: "Abgelehnt", value: stats.rejected, color: "text-red-600" },
            { label: "Ablehnungsrate", value: `${stats.rejectionRate}%`, color: stats.rejectionRate > 60 ? "text-red-600" : "text-orange-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-(--card) border border-(--border) rounded-xl p-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-(--muted) mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {message && !analysis && (
        <div className="bg-(--card) border border-(--border) rounded-xl p-8 text-center text-(--muted)">
          <p className="text-4xl mb-4">📊</p>
          <p>{message}</p>
          <p className="text-sm mt-2">Füge mehr Bewerbungen hinzu, um die Analyse zu aktivieren.</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Zusammenfassung */}
          <div className="bg-(--card) border border-(--border) rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">📝 KI-Analyse</h2>
            <p className="text-sm text-(--muted)">{analysis.summary}</p>
          </div>

          {/* Prognose */}
          {analysis.predictedOutcome && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">🔮 Erfolgsprognose</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-blue-200 text-sm">Aktuelle Erfolgsrate</p>
                  <p className="text-3xl font-bold">{analysis.predictedOutcome.currentSuccessRate}%</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Mit Verbesserungen</p>
                  <p className="text-3xl font-bold text-green-300">{analysis.predictedOutcome.improvedSuccessRate}%</p>
                </div>
                <div>
                  <p className="text-blue-200 text-sm">Nächstes Interview</p>
                  <p className="text-xl font-bold">{analysis.predictedOutcome.timeToNextInterview}</p>
                </div>
              </div>
            </div>
          )}

          {/* Muster */}
          {analysis.patterns?.length > 0 && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">🔍 Erkannte Muster</h2>
              <div className="space-y-3">
                {analysis.patterns.map((p, i) => (
                  <div key={i} className={`border-l-4 rounded-r-lg p-4 ${SEVERITY_COLORS[p.severity] ?? ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{p.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRI_BADGE[p.severity] ?? ""}`}>
                        {p.severity} · {p.affected} Bewerbungen
                      </span>
                    </div>
                    <p className="text-sm text-(--muted)">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empfehlungen */}
          {analysis.recommendations?.length > 0 && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">💡 Handlungsempfehlungen</h2>
              <div className="space-y-3">
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-(--surface) rounded-lg border border-(--border)">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${PRI_BADGE[r.priority] ?? ""}`}>
                      {r.priority}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{r.action}</p>
                      <p className="text-xs text-(--muted) mt-0.5">Erwarteter Effekt: {r.expectedImpact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erfolgsfaktoren */}
          {analysis.successFactors?.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">✅ Erfolgsfaktoren</h2>
              <ul className="space-y-1">
                {analysis.successFactors.map((f, i) => (
                  <li key={i} className="text-sm text-green-700 dark:text-green-400">✓ {f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
