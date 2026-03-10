"use client";
import { useState, useEffect } from "react";

interface Achievement {
  type: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, label: "Bewerbungs-Starter" },
  { level: 2, xp: 100, label: "Aktiver Bewerber" },
  { level: 3, xp: 300, label: "Karriere-Profi" },
  { level: 4, xp: 600, label: "Job-Hunter" },
  { level: 5, xp: 1000, label: "Bewerbungs-Champion" },
  { level: 6, xp: 2000, label: "Karriere-Meister" },
  { level: 7, xp: 5000, label: "Job-Legende" },
];

function getLevel(xp: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) return LEVEL_THRESHOLDS[i];
  }
  return LEVEL_THRESHOLDS[0];
}

function getNextLevel(xp: number) {
  const cur = getLevel(xp);
  const idx = LEVEL_THRESHOLDS.findIndex((t) => t.level === cur.level);
  return LEVEL_THRESHOLDS[idx + 1] ?? null;
}

export default function GamificationPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  useEffect(() => {
    fetch("/api/gamification/achievements")
      .then((r) => r.json())
      .then((d) => {
        setAchievements(d.achievements ?? []);
        setTotalXP(d.totalXP ?? 0);
        setUnlockedCount(d.unlockedCount ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentLevel = getLevel(totalXP);
  const nextLevel = getNextLevel(totalXP);
  const xpProgress = nextLevel
    ? ((totalXP - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
    : 100;

  const filtered = achievements.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--surface)">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🏆</div>
          <p className="text-(--muted)">Achievements werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">🏆 Gamification & Achievements</h1>
        <p className="text-(--muted) mt-2">
          Sammle XP für jede Aktivität und schalte Achievements frei. Verfolge deinen Karriere-Fortschritt!
        </p>
      </div>

      {/* Level-Karte */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-200 text-sm">Level {currentLevel.level}</p>
            <h2 className="text-2xl font-bold">{currentLevel.label}</h2>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">Gesamt-XP</p>
            <p className="text-3xl font-bold">{totalXP.toLocaleString()}</p>
          </div>
        </div>

        {nextLevel && (
          <>
            <div className="flex justify-between text-sm text-blue-200 mb-1">
              <span>{totalXP} XP</span>
              <span>{nextLevel.xp} XP → Level {nextLevel.level}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, xpProgress)}%` }}
              />
            </div>
            <p className="text-xs text-blue-200 mt-1">
              Noch {nextLevel.xp - totalXP} XP bis &ldquo;{nextLevel.label}&rdquo;
            </p>
          </>
        )}

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <p className="text-2xl font-bold">{unlockedCount}</p>
            <p className="text-xs text-blue-200">Freigeschaltet</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{achievements.length - unlockedCount}</p>
            <p className="text-xs text-blue-200">Ausstehend</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{achievements.length}</p>
            <p className="text-xs text-blue-200">Gesamt</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-6">
        {(["all", "unlocked", "locked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
              filter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-(--surface) border-(--border) hover:border-blue-400"
            }`}
          >
            {f === "all" ? "Alle" : f === "unlocked" ? "✅ Freigeschaltet" : "🔒 Gesperrt"}
          </button>
        ))}
      </div>

      {/* Achievement-Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a) => (
          <div
            key={a.type}
            className={`relative bg-(--card) border rounded-xl p-5 transition-all ${
              a.unlocked
                ? "border-yellow-400 shadow-md shadow-yellow-100 dark:shadow-yellow-900/20"
                : "border-(--border) opacity-60 grayscale"
            }`}
          >
            {a.unlocked && (
              <span className="absolute top-3 right-3 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                ✅ Freigeschaltet
              </span>
            )}
            <div className="text-4xl mb-3">{a.icon}</div>
            <h3 className="font-semibold text-base mb-1">{a.title}</h3>
            <p className="text-sm text-(--muted) mb-3">{a.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-yellow-600">+{a.xp} XP</span>
              {a.unlockedAt && (
                <span className="text-xs text-(--muted)">
                  {new Date(a.unlockedAt).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-(--muted)">
          <p className="text-4xl mb-4">🏅</p>
          <p>Keine Achievements in dieser Kategorie.</p>
        </div>
      )}
    </div>
  );
}
