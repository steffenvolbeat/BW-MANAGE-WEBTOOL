"use client";
import { useState } from "react";

interface NegotiationScript { opening: string; counteroffer: string; closing: string; }
interface MarketRange { min: number; max: number; median: number; currency: string; }
interface Recommendation { priority: string; action: string; expectedImpact: string; }
interface SalaryAnalysis {
  marketRange: MarketRange;
  negotiationStrategy: string;
  openingOffer: number;
  walkAwayPoint: number;
  keyArguments: string[];
  scripts: NegotiationScript;
  commonMistakes: string[];
  bonusItems: string[];
  tips: string[];
  summary: string;
  confidenceScore: number;
  recommendations?: Recommendation[];
}

const STRATEGY_LABELS: Record<string, { label: string; color: string }> = {
  CONSERVATIVE: { label: "Konservativ", color: "text-blue-600" },
  MODERATE:     { label: "Moderat",     color: "text-yellow-600" },
  AGGRESSIVE:   { label: "Aggressiv",   color: "text-red-600" },
};

export default function SalaryCoachPage() {
  const [form, setForm] = useState({
    position: "",
    currentSalary: "",
    targetSalary: "",
    yearsXP: "",
    skills: "",
    region: "Deutschland",
    company: "",
    industry: "IT/Tech",
    offerReceived: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SalaryAnalysis | null>(null);
  const [error, setError] = useState("");
  const [activeScript, setActiveScript] = useState<keyof NegotiationScript>("opening");

  const update = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function analyze() {
    if (!form.position) { setError("Bitte Position eingeben."); return; }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ai/salary-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          currentSalary: form.currentSalary ? Number(form.currentSalary) : undefined,
          targetSalary: form.targetSalary ? Number(form.targetSalary) : undefined,
          yearsXP: form.yearsXP ? Number(form.yearsXP) : undefined,
          skills: form.skills ? form.skills.split(",").map((s) => s.trim()) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setResult(data.analysis as SalaryAnalysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString("de-DE") + " €";
  const strategy = result ? (STRATEGY_LABELS[result.negotiationStrategy] ?? STRATEGY_LABELS.MODERATE) : null;

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">💰 Gehalts-Verhandlungs-Coach</h1>
        <p className="text-(--muted) mt-2">
          KI-gestützter Verhandlungsplan mit Marktwert-Analyse, Argumentationshilfen und Gesprächs-Skripten.
        </p>
      </div>

      <div className="bg-(--card) border border-(--border) rounded-xl p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: "position", label: "Position *", placeholder: "z.B. Senior Backend Developer" },
            { key: "industry", label: "Branche", placeholder: "z.B. IT/Tech, Consulting" },
            { key: "company", label: "Firma (optional)", placeholder: "z.B. SAP, BMW" },
            { key: "region", label: "Region", placeholder: "z.B. München, Hamburg" },
            { key: "currentSalary", label: "Aktuelles Gehalt (€/Jahr)", placeholder: "z.B. 65000" },
            { key: "targetSalary", label: "Zielgehalt (€/Jahr)", placeholder: "z.B. 80000" },
            { key: "yearsXP", label: "Berufserfahrung (Jahre)", placeholder: "z.B. 5" },
            { key: "skills", label: "Hauptskills (kommasepariert)", placeholder: "z.B. Python, AWS, Kubernetes" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-medium text-(--muted) mb-1 block">{label}</label>
              <input
                type={["currentSalary", "targetSalary", "yearsXP"].includes(key) ? "number" : "text"}
                value={form[key as keyof typeof form] as string}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <label className="flex items-center gap-3 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.offerReceived}
            onChange={(e) => update("offerReceived", e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Ich habe bereits ein konkretes Angebot erhalten</span>
        </label>

        <button
          onClick={analyze}
          disabled={loading}
          className="mt-6 w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition"
        >
          {loading ? "⏳ Analysiere Markt & erstelle Strategie..." : "💰 Verhandlungsstrategie erstellen"}
        </button>
        {error && <p className="text-red-500 text-sm mt-3">⚠️ {error}</p>}
      </div>

      {result && strategy && (
        <div className="space-y-6">
          {/* Überblick */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-(--card) border border-(--border) rounded-xl p-5 text-center">
              <p className="text-(--muted) text-sm">Einstiegsgebot</p>
              <p className="text-3xl font-bold text-green-600">{fmt(result.openingOffer)}</p>
            </div>
            <div className="bg-(--card) border border-(--border) rounded-xl p-5 text-center">
              <p className="text-(--muted) text-sm">Markt-Median</p>
              <p className="text-3xl font-bold text-blue-600">{fmt(result.marketRange?.median ?? 0)}</p>
              <p className="text-xs text-(--muted)">{fmt(result.marketRange?.min ?? 0)} – {fmt(result.marketRange?.max ?? 0)}</p>
            </div>
            <div className="bg-(--card) border border-(--border) rounded-xl p-5 text-center">
              <p className="text-(--muted) text-sm">Strategie</p>
              <p className={`text-2xl font-bold ${strategy.color}`}>{strategy.label}</p>
              <p className="text-xs text-(--muted)">Konfidenz: {result.confidenceScore}%</p>
            </div>
          </div>

          {/* Zusammenfassung */}
          <div className="bg-(--card) border border-(--border) rounded-xl p-6">
            <h3 className="font-semibold mb-2">📝 Zusammenfassung</h3>
            <p className="text-sm text-(--muted)">{result.summary}</p>
          </div>

          {/* Argumente */}
          <div className="bg-(--card) border border-(--border) rounded-xl p-6">
            <h3 className="font-semibold mb-3">💪 Deine stärksten Argumente</h3>
            <ul className="space-y-2">
              {result.keyArguments?.map((arg, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500">✓</span> {arg}
                </li>
              ))}
            </ul>
          </div>

          {/* Gesprächs-Skripte */}
          <div className="bg-(--card) border border-(--border) rounded-xl p-6">
            <h3 className="font-semibold mb-4">🎙️ Gesprächs-Skripte</h3>
            <div className="flex gap-2 mb-4">
              {(["opening", "counteroffer", "closing"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveScript(s)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${activeScript === s ? "bg-blue-600 text-white" : "bg-(--surface) border border-(--border)"}`}
                >
                  {s === "opening" ? "Einstieg" : s === "counteroffer" ? "Gegenangebot" : "Abschluss"}
                </button>
              ))}
            </div>
            <div className="bg-(--surface) rounded-lg p-4 border border-(--border)">
              <p className="text-sm italic leading-relaxed">&ldquo;{result.scripts?.[activeScript]}&rdquo;</p>
            </div>
          </div>

          {/* Bonus-Leistungen */}
          {result.bonusItems?.length > 0 && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-6">
              <h3 className="font-semibold mb-3">🎁 Zusatzleistungen verhandeln</h3>
              <div className="flex flex-wrap gap-2">
                {result.bonusItems.map((item, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fehler vermeiden */}
          {result.commonMistakes?.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-700 dark:text-red-300 mb-3">❌ Diese Fehler vermeiden</h3>
              <ul className="space-y-1">
                {result.commonMistakes.map((m, i) => (
                  <li key={i} className="text-sm text-red-600 dark:text-red-400">• {m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
