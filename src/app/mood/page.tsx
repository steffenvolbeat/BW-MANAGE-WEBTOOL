"use client";
import { useState, useEffect } from "react";

interface MoodEntry {
  id: string;
  mood: number;
  energy: number;
  stress: number;
  note: string | null;
  createdAt: string;
}

const MOOD_LABELS = ["", "😢 Sehr schlecht", "😕 Schlecht", "😐 Neutral", "🙂 Gut", "😊 Sehr gut"];
const ENERGY_LABELS = ["", "💤 Erschöpft", "😴 Müde", "⚡ Ok", "⚡⚡ Fit", "⚡⚡⚡ Top-Energie"];
const STRESS_LABELS = ["", "😌 Kein Stress", "🟡 Wenig", "🟠 Mittel", "🔴 Viel", "🚨 Extrem"];

// Slider als eigenständige Komponente außerhalb der Page-Funktion definiert,
// um "Cannot create components during render"-Bug zu vermeiden.
function MoodSlider({ value, onChange, labels, color }: { value: number; onChange: (v: number) => void; labels: string[]; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`w-10 h-10 rounded-full text-lg transition-transform ${v === value ? `${color} scale-125` : "bg-(--surface) border border-(--border) hover:scale-110"}`}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-(--muted) mt-1">{labels[value]}</p>
    </div>
  );
}

export default function StimmungsBarometerPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [averages, setAverages] = useState<{ mood: number; energy: number; stress: number } | null>(null);
  const [burnoutWarning, setBurnoutWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(2);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    const res = await fetch("/api/mood");
    const data = await res.json();
    setEntries(data.entries ?? []);
    setAverages(data.averages);
    setBurnoutWarning(data.burnoutWarning ?? false);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, energy, stress, note: note || undefined }),
    });
    if (res.ok) {
      setSaved(true);
      setNote("");
      await load();
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">😊 Stimmungs-Barometer</h1>
        <p className="text-(--muted) mt-2">
          Tracke deine tägliche Stimmung, Energie und Stress während der Jobsuche. Erkenne Burnout-Muster frühzeitig.
        </p>
      </div>

      {/* Burnout-Warnung */}
      {burnoutWarning && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-300">Burnout-Warnung!</h3>
            <p className="text-sm text-red-600 dark:text-red-400">
              Du zeigst Anzeichen von Überlastung (hoher Stress + niedrige Energie über mehrere Tage). 
              Bitte gönn dir eine Pause! 💙
            </p>
          </div>
        </div>
      )}

      {/* Eingabe-Formular */}
      <div className="bg-(--card) border border-(--border) rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-6">Wie geht es dir heute?</h2>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">😊 Stimmung</label>
            <MoodSlider value={mood} onChange={setMood} labels={MOOD_LABELS} color="bg-yellow-400" />
          </div>
          <div>
            <label className="text-sm font-medium mb-3 block">⚡ Energie</label>
            <MoodSlider value={energy} onChange={setEnergy} labels={ENERGY_LABELS} color="bg-blue-400" />
          </div>
          <div>
            <label className="text-sm font-medium mb-3 block">🌡️ Stress</label>
            <MoodSlider value={stress} onChange={setStress} labels={STRESS_LABELS} color="bg-red-400" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">📝 Notiz (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Was bewegt dich heute? (optional)"
              className="w-full h-20 p-3 bg-(--surface) border border-(--border) rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="mood-note-input"
              name="mood-note"
            />
          </div>

          <button
            onClick={submit}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? "💾 Speichern..." : saved ? "✅ Gespeichert!" : "💾 Stimmung speichern"}
          </button>
        </div>
      </div>

      {/* Durchschnittswerte */}
      {averages && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Ø Stimmung", value: averages.mood, icon: "😊", color: "text-yellow-600" },
            { label: "Ø Energie", value: averages.energy, icon: "⚡", color: "text-blue-600" },
            { label: "Ø Stress", value: averages.stress, icon: "🌡️", color: "text-red-600" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="bg-(--card) border border-(--border) rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className={`text-3xl font-bold ${color}`}>{value.toFixed(1)}</p>
              <p className="text-xs text-(--muted)">{label} (30 Tage)</p>
            </div>
          ))}
        </div>
      )}

      {/* Historie */}
      {!loading && entries.length > 0 && (
        <div className="bg-(--card) border border-(--border) rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">📈 Verlauf (letzte 30 Einträge)</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-3 bg-(--surface) rounded-lg text-sm">
                <span className="text-(--muted) text-xs w-24 flex-shrink-0">
                  {new Date(e.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                </span>
                <div className="flex gap-4 flex-1">
                  <span title="Stimmung">😊 {e.mood}/5</span>
                  <span title="Energie">⚡ {e.energy}/5</span>
                  <span title="Stress">🌡️ {e.stress}/5</span>
                </div>
                {e.note && <span className="text-(--muted) italic truncate max-w-48">{e.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-12 text-(--muted)">
          <p className="text-4xl mb-4">😐</p>
          <p>Noch keine Einträge. Füge deinen ersten Stimmungs-Eintrag hinzu!</p>
        </div>
      )}
    </div>
  );
}
