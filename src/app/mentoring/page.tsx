"use client";
import { useState, useEffect } from "react";

interface MentorProfile {
  id: string;
  userId: string;
  headline: string;
  bio: string;
  skills: string[];
  industries: string[];
  hourlyRate: number | null;
  rating: number;
  sessionCount: number;
  user: { name: string; avatarUrl: string | null };
}

interface MyProfile {
  id: string;
  headline: string;
  bio: string;
  skills: string[];
  industries: string[];
  hourlyRate: number | null;
  isAvailable: boolean;
}

export default function MentoringPage() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"browse" | "become">("browse");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Formular für Mentor-Profil
  const [form, setForm] = useState({ headline: "", bio: "", skills: "", industries: "", hourlyRate: "", isAvailable: true });

  useEffect(() => {
    fetch("/api/mentoring")
      .then((r) => r.json())
      .then((d) => {
        setMentors(d.mentors ?? []);
        setMyProfile(d.myProfile ?? null);
        if (d.myProfile) {
          setForm({
            headline: d.myProfile.headline,
            bio: d.myProfile.bio,
            skills: d.myProfile.skills.join(", "),
            industries: d.myProfile.industries.join(", "),
            hourlyRate: d.myProfile.hourlyRate?.toString() ?? "",
            isAvailable: d.myProfile.isAvailable,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = mentors.filter(
    (m) =>
      m.user.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.headline.toLowerCase().includes(search.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/mentoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: form.headline,
          bio: form.bio,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          industries: form.industries.split(",").map((s) => s.trim()).filter(Boolean),
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
          isAvailable: form.isAvailable,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // Speichern fehlgeschlagen
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--surface)">
        <div className="text-4xl animate-pulse">🎓</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">🎓 Mentoring-Marktplatz</h1>
        <p className="text-(--muted) mt-2">
          Finde erfahrene Mentoren aus der IT-Branche oder biete selbst Mentoring an.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setTab("browse")}
          className={`px-6 py-2 rounded-lg font-medium transition border ${tab === "browse" ? "bg-blue-600 text-white border-blue-600" : "bg-(--surface) border-(--border) hover:border-blue-400"}`}
        >
          🔍 Mentoren durchsuchen
        </button>
        <button
          onClick={() => setTab("become")}
          className={`px-6 py-2 rounded-lg font-medium transition border ${tab === "become" ? "bg-purple-600 text-white border-purple-600" : "bg-(--surface) border-(--border) hover:border-purple-400"}`}
        >
          {myProfile ? "✏️ Mein Mentor-Profil" : "🌟 Mentor werden"}
        </button>
      </div>

      {tab === "browse" && (
        <>
          <div className="mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mentor suchen (Name, Skill, Headline)..."
              className="w-full px-4 py-3 bg-(--card) border border-(--border) rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-(--muted)">
              <p className="text-4xl mb-4">🎓</p>
              <p>Noch keine Mentoren verfügbar. Sei der Erste!</p>
              <button onClick={() => setTab("become")} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Mentor werden
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((mentor) => (
                <div key={mentor.id} className="bg-(--card) border border-(--border) rounded-xl p-6 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {mentor.user.name?.[0] ?? "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold">{mentor.user.name}</h3>
                      <p className="text-xs text-(--muted)">{mentor.headline}</p>
                    </div>
                  </div>
                  <p className="text-sm text-(--muted) mb-3 line-clamp-2">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mentor.skills.slice(0, 4).map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-yellow-500">★ {mentor.rating > 0 ? mentor.rating.toFixed(1) : "Neu"}</span>
                    <span className="text-(--muted)">{mentor.sessionCount} Sessions</span>
                    {mentor.hourlyRate && <span className="font-semibold text-green-600">{mentor.hourlyRate}€/h</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "become" && (
        <div className="bg-(--card) border border-(--border) rounded-xl p-6 max-w-2xl">
          <h2 className="text-lg font-semibold mb-6">{myProfile ? "Mentor-Profil bearbeiten" : "Mentor-Profil erstellen"}</h2>
          <div className="space-y-4">
            {[
              { key: "headline", label: "Headline *", placeholder: "z.B. Senior Full-Stack Dev mit 10 Jahren Karriereberatung" },
              { key: "skills", label: "Skills (kommasepariert)", placeholder: "z.B. Python, React, System Design" },
              { key: "industries", label: "Branchen (kommasepariert)", placeholder: "z.B. FinTech, E-Commerce, SaaS" },
              { key: "hourlyRate", label: "Stundensatz (€, optional)", placeholder: "z.B. 80" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium text-(--muted) mb-1 block">{label}</label>
                <input
                  type={key === "hourlyRate" ? "number" : "text"}
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-(--muted) mb-1 block">Bio *</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Beschreibe deine Erfahrung und wie du Mentees helfen kannst..."
                className="w-full h-24 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="mentor-bio"
                name="mentor-bio"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Verfügbar für neue Mentees</span>
            </label>
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="mt-6 w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {saving ? "💾 Speichern..." : saved ? "✅ Gespeichert!" : (myProfile ? "💾 Profil aktualisieren" : "🌟 Als Mentor registrieren")}
          </button>
        </div>
      )}
    </div>
  );
}
