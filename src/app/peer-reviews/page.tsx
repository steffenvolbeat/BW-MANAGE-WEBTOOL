"use client";
import { useState, useEffect, useCallback } from "react";

type Tab = "submit" | "browse" | "received";

interface Review {
  id: string;
  documentType: string;
  documentText: string;
  feedback?: string;
  rating?: number;
  isAnonymous: boolean;
  createdAt: string;
  authorId?: string;
}

const DOC_TYPES = ["CV", "COVER_LETTER", "PORTFOLIO", "LINKEDIN", "OTHER"];
const DOC_LABELS: Record<string, string> = {
  CV: "Lebenslauf", COVER_LETTER: "Anschreiben",
  PORTFOLIO: "Portfolio", LINKEDIN: "LinkedIn-Profil", OTHER: "Sonstiges",
};

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange?.(star)}
        className={`text-2xl ${star <= value ? "text-yellow-400" : "text-gray-300"} ${onChange ? "hover:text-yellow-400 cursor-pointer" : "cursor-default"}`}
      >
        ★
      </button>
    ))}
  </div>
);

export default function PeerReviewsPage() {
  const [tab, setTab] = useState<Tab>("submit");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [received, setReceived] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit-Form
  const [form, setForm] = useState({
    documentType: "CV",
    documentText: "",
    isAnonymous: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Feedback-Form
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { text: string; rating: number }>>({});
  const [sendingFeedback, setSendingFeedback] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/peer-reviews")
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.openRequests ?? []);
        setReceived(d.receivedReviews ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() ruft setState via useCallback auf (valides async-Pattern)
  useEffect(() => { load(); }, [load]);

  const submitRequest = async () => {
    if (!form.documentText.trim()) return;
    setSubmitting(true);
    await fetch("/api/peer-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", ...form }),
    });
    setSubmitted(true);
    setSubmitting(false);
    setForm({ documentType: "CV", documentText: "", isAnonymous: true });
    load();
  };

  const sendFeedback = async (reviewId: string) => {
    const fb = feedbackMap[reviewId];
    if (!fb?.text) return;
    setSendingFeedback(reviewId);
    await fetch("/api/peer-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "feedback",
        reviewId,
        feedback: fb.text,
        rating: fb.rating ?? 3,
      }),
    });
    setSendingFeedback(null);
    setFeedbackMap((prev) => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
    });
    load();
  };

  const updateFeedback = (id: string, field: "text" | "rating", value: string | number) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [id]: { text: prev[id]?.text ?? "", rating: prev[id]?.rating ?? 3, [field]: value },
    }));
  };

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "submit", label: "📤 Feedback anfordern" },
    { id: "browse", label: "👥 Anderen helfen", badge: reviews.length },
    { id: "received", label: "📬 Erhaltenes Feedback", badge: received.filter((r) => r.feedback).length },
  ];

  return (
    <div className="min-h-screen bg-(--surface) text-foreground p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">👥 Peer-Review-Netzwerk</h1>
        <p className="text-(--muted) mt-2">
          Erhalte anonymes Feedback von anderen Bewerbern. 
          Hilf anderen und erhalte selbst wertvolle Einschätzungen.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-(--border) pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
              tab === t.id ? "text-blue-600 border-b-2 border-blue-600" : "text-(--muted) hover:text-foreground"
            }`}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Feedback anfordern */}
      {tab === "submit" && (
        <div className="bg-(--card) border border-(--border) rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Dokument zur Prüfung einreichen</h2>
          {submitted && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-4 text-sm">
              ✅ Anfrage gesendet! Das Community gibt dir bald Feedback.
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-(--muted) block mb-1">Dokumenttyp</label>
              <select
                className="w-full border border-(--border) rounded-lg px-3 py-2 bg-(--surface) text-sm"
                value={form.documentType}
                onChange={(e) => setForm({ ...form, documentType: e.target.value })}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{DOC_LABELS[t] ?? t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-(--muted) block mb-1">
                Dokumentinhalt{" "}
                <span className="text-xs">({form.documentText.length} Zeichen)</span>
              </label>
              <textarea
                rows={10}
                className="w-full border border-(--border) rounded-lg px-3 py-2 bg-(--surface) text-sm resize-y"
                placeholder="Füge hier deinen Lebenslauf, dein Anschreiben oder dein LinkedIn-Profil ein..."
                value={form.documentText}
                onChange={(e) => setForm({ ...form, documentText: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
              />
              Anonym einreichen (empfohlen)
            </label>
            <button
              onClick={submitRequest}
              disabled={submitting || !form.documentText.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Sende..." : "📤 Feedback anfordern"}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Anderen helfen */}
      {tab === "browse" && (
        <div className="space-y-4">
          {loading && <p className="text-center text-(--muted) py-8">Lade Anfragen...</p>}
          {!loading && reviews.length === 0 && (
            <div className="text-center text-(--muted) py-12">
              <p className="text-4xl mb-3">🎉</p>
              <p>Aktuell gibt es keine offenen Feedback-Anfragen.</p>
            </div>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="bg-(--card) border border-(--border) rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                  {DOC_LABELS[r.documentType] ?? r.documentType}
                </span>
                {r.isAnonymous && <span className="text-xs text-(--muted)">🔒 Anonym</span>}
                <span className="text-xs text-(--muted) ml-auto">
                  {new Date(r.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>

              {/* Dokumentvorschau */}
              <div className="bg-(--surface) border border-(--border) rounded-lg p-4 mb-4 max-h-32 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap text-(--muted)">{r.documentText.substring(0, 500)}
                {r.documentText.length > 500 ? "..." : ""}</p>
              </div>

              {/* Feedback geben */}
              {!feedbackMap[r.id] ? (
                <button
                  onClick={() => updateFeedback(r.id, "text", "")}
                  className="text-sm px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  💬 Feedback geben
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={4}
                    className="w-full border border-(--border) rounded-lg px-3 py-2 bg-(--surface) text-sm resize-y"
                    placeholder="Dein konstruktives Feedback..."
                    value={feedbackMap[r.id]?.text ?? ""}
                    onChange={(e) => updateFeedback(r.id, "text", e.target.value)}
                  />
                  <div className="flex items-center gap-4">
                    <StarRating
                      value={feedbackMap[r.id]?.rating ?? 3}
                      onChange={(v) => updateFeedback(r.id, "rating", v)}
                    />
                    <button
                      onClick={() => sendFeedback(r.id)}
                      disabled={sendingFeedback === r.id || !feedbackMap[r.id]?.text}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                    >
                      {sendingFeedback === r.id ? "Sende..." : "✓ Absenden"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Erhaltenes Feedback */}
      {tab === "received" && (
        <div className="space-y-4">
          {loading && <p className="text-center text-(--muted) py-8">Lade Feedback...</p>}
          {!loading && received.length === 0 && (
            <div className="text-center text-(--muted) py-12">
              <p className="text-4xl mb-3">📬</p>
              <p>Noch kein Feedback erhalten. Reiche ein Dokument ein!</p>
            </div>
          )}
          {received.map((r) => (
            <div key={r.id} className="bg-(--card) border border-(--border) rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                  {DOC_LABELS[r.documentType] ?? r.documentType}
                </span>
                <span className="text-xs text-(--muted) ml-auto">
                  {new Date(r.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>

              {r.feedback ? (
                <div>
                  {r.rating != null && (
                    <div className="mb-3">
                      <StarRating value={r.rating} />
                    </div>
                  )}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{r.feedback}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-(--muted) italic">⏳ Noch kein Feedback eingegangen...</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
