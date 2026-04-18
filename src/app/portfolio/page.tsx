"use client";
import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface PortfolioProfile {
  id: string;
  slug: string;
  headline: string;
  bio: string;
  skills: string[];
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  theme: string;
  isPublic: boolean;
  views: number;
  updatedAt: string;
}

interface UserData {
  applications: { companyName: string; position: string; status: string; appliedAt: string }[];
  documents: { name: string; type: string; uploadedAt: string }[];
  contactCount: number;
}

const THEMES = [
  { id: "modern",   label: "Modern",   bg: "bg-gradient-to-br from-blue-600 to-purple-700" },
  { id: "dark",     label: "Dark Pro",  bg: "bg-gradient-to-br from-gray-900 to-black" },
  { id: "minimal",  label: "Minimal",   bg: "bg-gradient-to-br from-gray-100 to-white" },
  { id: "nature",   label: "Nature",    bg: "bg-gradient-to-br from-green-500 to-teal-600" },
  { id: "sunset",   label: "Sunset",    bg: "bg-gradient-to-br from-orange-500 to-pink-600" },
];

export default function PortfolioPage() {
  const [profile, setProfile] = useState<PortfolioProfile | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    headline: "",
    bio: "",
    skills: "",
    githubUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
    theme: "modern",
    isPublic: false,
    slug: "",
  });
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile);
        setUserData(d.userData);
        if (d.profile) {
          setForm({
            headline: d.profile.headline,
            bio: d.profile.bio,
            skills: d.profile.skills.join(", "),
            githubUrl: d.profile.githubUrl ?? "",
            linkedinUrl: d.profile.linkedinUrl ?? "",
            websiteUrl: d.profile.websiteUrl ?? "",
            theme: d.profile.theme,
            isPublic: d.profile.isPublic,
            slug: d.profile.slug,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          githubUrl: form.githubUrl || null,
          linkedinUrl: form.linkedinUrl || null,
          websiteUrl: form.websiteUrl || null,
          slug: form.slug || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // Speichern fehlgeschlagen
    } finally {
      setSaving(false);
    }
  }

  const publicUrl = profile ? `${typeof window !== "undefined" ? window.location.origin : ""}/portfolio/${profile.slug}` : "";

  const selectedTheme = THEMES.find((t) => t.id === form.theme) ?? THEMES[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--surface)">
        <div className="text-4xl animate-pulse">🌐</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">🌐 Portfolio-Website-Generator</h1>
        <p className="text-(--muted) mt-2">
          Erstelle deine professionelle Portfolio-Website automatisch aus deinen Bewerbungsdaten.
          Teile sie mit Recruitern als öffentlichen Link.
        </p>
      </div>

      {/* Stats aus echten Daten */}
      {userData && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Bewerbungen", value: userData.applications.length, icon: "📨" },
            { label: "Dokumente", value: userData.documents.length, icon: "📄" },
            { label: "Kontakte", value: userData.contactCount, icon: "👥" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-(--card) border border-(--border) rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-(--muted)">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formular */}
        <div className="bg-(--card) border border-(--border) rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Portfolio konfigurieren</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-(--muted) mb-1 block">Headline *</label>
              <input type="text" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                placeholder="z.B. Senior Full-Stack Developer | React & Node.js"
                className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-(--muted) mb-1 block">Über mich *</label>
              <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Beschreibe dich in 2-3 Sätzen..."
                className="w-full h-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="portfolio-bio" name="portfolio-bio" />
            </div>
            <div>
              <label className="text-sm font-medium text-(--muted) mb-1 block">Skills (kommasepariert)</label>
              <input type="text" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                placeholder="React, Node.js, TypeScript, PostgreSQL..."
                className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {[
              { key: "githubUrl", label: "GitHub URL", placeholder: "https://github.com/username" },
              { key: "linkedinUrl", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/username" },
              { key: "websiteUrl", label: "Persönliche Website", placeholder: "https://meine-website.de" },
              { key: "slug", label: "Kurz-URL (Slug)", placeholder: "mein-name" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium text-(--muted) mb-1 block">{label}</label>
                <input type="text" value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}

            {/* Theme-Auswahl */}
            <div>
              <label className="text-sm font-medium text-(--muted) mb-2 block">Design-Theme</label>
              <div className="flex gap-2">
                {THEMES.map((theme) => (
                  <button key={theme.id} onClick={() => setForm((f) => ({ ...f, theme: theme.id }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium text-white transition ${theme.bg} ${form.theme === theme.id ? "ring-2 ring-offset-2 ring-blue-400" : "opacity-70 hover:opacity-100"}`}>
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-sm">Portfolio öffentlich zugänglich machen</span>
            </label>

            <button onClick={save} disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? "💾 Speichern..." : saved ? "✅ Gespeichert!" : "💾 Portfolio speichern"}
            </button>
          </div>
        </div>

        {/* Vorschau */}
        <div>
          <div className={`${selectedTheme.bg} rounded-2xl p-6 text-white h-64 flex flex-col justify-between shadow-lg mb-4`}>
            <div>
              <div className="w-14 h-14 bg-white/20 rounded-full mb-3 flex items-center justify-center text-2xl">👤</div>
              <h2 className="text-xl font-bold">{form.headline || "Deine Headline"}</h2>
              <p className="text-sm opacity-80 mt-1 line-clamp-2">{form.bio || "Deine Bio..."}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(form.skills || "").split(",").slice(0, 4).map((s) => s.trim()).filter(Boolean).map((skill) => (
                <span key={skill} className="px-2 py-0.5 bg-white/20 rounded-full text-xs">{skill}</span>
              ))}
            </div>
          </div>

          {profile && form.isPublic && (
            <div className="bg-(--card) border border-(--border) rounded-xl p-4">
              <p className="text-sm font-medium mb-2">🔗 Öffentlicher Link</p>
              <div className="flex gap-2">
                <input ref={linkRef} type="text" readOnly value={publicUrl}
                  className="flex-1 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--muted)" />
                <button onClick={() => { linkRef.current?.select(); navigator.clipboard.writeText(publicUrl); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Kopieren
                </button>
              </div>
              <p className="text-xs text-(--muted) mt-1">Aufrufe: {profile.views}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
