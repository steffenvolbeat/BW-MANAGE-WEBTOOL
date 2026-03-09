"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ClockIcon, CogIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/AuthProvider";

export default function ComingSoonPage() {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-(--surface) flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const features = [
    {
      title: "Umfassendes Dashboard",
      description:
        "Zentrale Übersicht über alle Bewerbungsaktivitäten mit intelligenten Statistiken und Insights",
      status: "completed",
      phase: "Phase 1-2",
    },
    {
      title: "Intelligenter Kalender",
      description:
        "Vollständiger Monatskalender mit Event-Management, Termintypen und anstehenden Interviews",
      status: "completed",
      phase: "Phase 3",
    },
    {
      title: "Dokument-Management",
      description:
        "Professionelle Verwaltung von Lebensläufen, Anschreiben und Zeugnissen mit Tag-System und Ordnern",
      status: "completed",
      phase: "Phase 3",
    },
    {
      title: "Bewerbungsübersichten",
      description:
        "Detaillierte Tabellen für Inland- und Auslandsbewerbungen mit erweiterten Filter- und Suchfunktionen",
      status: "completed",
      phase: "Phase 3",
    },
    {
      title: "Kontakte & Networking",
      description:
        "Professionelles Kontakt-Management für Recruiter, Ansprechpartner und Business-Networking mit Follow-up-System",
      status: "completed",
      phase: "Phase 4",
    },
    {
      title: "Reports & Analytics",
      description:
        "Detaillierte Berichte und Analysen über Bewerbungsverhalten, Erfolgsraten und Markttrends mit KPI-Dashboard",
      status: "completed",
      phase: "Phase 4",
    },
    {
      title: "Admin Panel",
      description:
        "Enterprise-ready Admin Panel mit System-Monitoring, Benutzer-Management und Feature Flags",
      status: "completed",
      phase: "Phase 4",
    },
    {
      title: "API Integration",
      description:
        "PostgreSQL-Datenbankanbindung mit Prisma ORM und Next.js API Routes für echte Datenpersistenz",
      status: "completed",
      phase: "Phase 5",
    },
    {
      title: "User Authentication",
      description:
        "Sichere Benutzeranmeldung und Session-Management mit Role-based Access Control",
      status: "completed",
      phase: "Phase 5",
    },
    {
      title: "Job-Portal Integration",
      description:
        "Direkte Anbindung an StepStone, Xing, LinkedIn und andere Job-Portale für automatischen Import",
      status: "completed",
      phase: "Phase 6",
    },
    {
      title: "Meeting-Integration",
      description:
        "Nahtlose Integration mit Zoom, Microsoft Teams und Loom für Bewerbungsgespräche",
      status: "completed",
      phase: "Phase 6",
    },
    {
      title: "Automatische Erinnerungen",
      description:
        "KI-gestützte Erinnerungen für Follow-ups, Deadlines und wichtige Termine",
      status: "completed",
      phase: "Phase 6",
    },
  ];

  const roadmap = [
    {
      phase: "Phase 1",
      title: "Frontend-Grundlagen",
      status: "completed",
      items: [
        "✅ Next.js 16.0.9 Setup mit TypeScript",
        "✅ Tailwind CSS 4 Integration",
        "✅ Dokumentationserstellung (7 MD-Dateien)",
        "✅ Coming Soon Page mit Roadmap",
        "✅ Layout & Navigation System",
        "✅ Dashboard mit Statistiken & Aktivitäten",
      ],
    },
    {
      phase: "Phase 2",
      title: "Layout & Navigation",
      status: "completed",
      items: [
        "✅ Responsive Header mit Admin-Zugang",
        "✅ Sidebar-Navigation (8 Hauptbereiche)",
        "✅ MainLayout-Wrapper-System",
        "✅ Mobile-optimierte Navigation",
        "✅ Icon-Integration (Heroicons)",
        "✅ Enterprise UX/UI Design",
      ],
    },
    {
      phase: "Phase 3",
      title: "Core Pages Implementation",
      status: "completed",
      items: [
        "✅ Bewerbungsformular mit Validierung",
        "✅ Bewerbungsübersicht mit Smart-Filtern",
        "✅ Kalender mit Event-Management",
        "✅ Dokument-Management (Grid/List-View)",
        "✅ TypeScript-Interfaces für alle Daten",
        "✅ Responsive Design für alle Seiten",
      ],
    },
    {
      phase: "Phase 4",
      title: "Erweiterte Features",
      status: "completed",
      items: [
        "✅ Kontakte & Networking-System",
        "✅ Reports & Analytics Dashboard",
        "✅ Admin Panel (Enterprise-ready)",
        "✅ Erweiterte Such- & Filterfunktionen",
        "✅ Smart-Filter für alle Module",
        "✅ Performance-Monitoring",
      ],
    },
    {
      phase: "Phase 5",
      title: "Backend & Integration",
      status: "completed",
      items: [
        "✅ PostgreSQL Setup (Docker Container)",
        "✅ Prisma ORM Integration",
        "✅ User Authentication (NextAuth.js)",
        "✅ API Routes Development (CRUD)",
        "✅ Role-based Access Control",
        "✅ Session Management",
      ],
    },
    {
      phase: "Phase 6",
      title: "Erweiterte Integrationen",
      status: "completed",
      items: [
        "✅ Job-Portal APIs (StepStone, Xing, LinkedIn, Indeed)",
        "✅ Meeting-Integration (Zoom, Teams, Loom)",
        "✅ Automatische Erinnerungen",
        "✅ Smart Notifications",
        "✅ Follow-up Management",
        "✅ Interview Scheduling",
      ],
    },
    {
      phase: "Phase 7",
      title: "Testing & Deployment",
      status: "in-progress",
      items: [
        "✅ Jest Unit Tests",
        "✅ Cypress E2E Tests",
        "⏳ Performance Optimization",
        "⏳ Security Audit",
        "⏳ Docker Configuration",
        "⏳ Production Deployment",
      ],
    },
  ];

  const futuristicFeatures = [
    {
      category: "🔐 Fundament",
      color: "from-purple-600 to-indigo-600",
      bg: "bg-purple-50 border-purple-200",
      badge: "bg-purple-100 text-purple-800",
      items: [
        {
          id: 1,
          title: "Multi-User Auth-System",
          status: "completed",
          icon: "🔑",
          desc: "E-Mail + Passwort (bcrypt), JWT + HttpOnly-Cookies, Registrierung & Login, Passwort-Sichtbarkeit",
          tech: ["JWT (jose)", "bcryptjs", "HttpOnly-Cookie", "Next.js Middleware"],
        },
        {
          id: 2,
          title: "2FA / MFA",
          status: "completed",
          icon: "📱",
          desc: "TOTP (Google Authenticator, Authy), Backup-Codes, optional WebAuthn / Fingerabdruck im Browser",
          tech: ["TOTP (otpauth)", "WebAuthn", "QR-Code-Generator"],
        },
      ],
    },
    {
      category: "🤖 KI & AI-Agents",
      color: "from-blue-600 to-cyan-600",
      bg: "bg-blue-50 border-blue-200",
      badge: "bg-blue-100 text-blue-800",
      items: [
        {
          id: 3,
          title: "3D AI-Avatar / Bot",
          status: "completed",
          icon: "🧑‍💻",
          desc: "Animierter sprechender 3D-Avatar, Lippensynchronisation mit TTS, Reaktion auf Spracheingaben",
          tech: ["Three.js", "React Three Fiber", "Ready Player Me", "Eleven Labs TTS", "Web Speech API"],
        },
        {
          id: 4,
          title: "JobCoach AI – Vollständiger KI-Assistent",
          status: "completed",
          icon: "🧠",
          desc: "Permanente Chat-Sidebar mit Kontextwissen aller Bewerbungen, proaktive Vorschläge, mehrsprachig (DE/EN)",
          tech: ["Ollama / OpenAI / Anthropic", "RAG", "LangChain", "pgvector"],
        },
        {
          id: 5,
          title: "Voice AI Coach (Sprach-KI)",
          status: "planned",
          icon: "🎙️",
          desc: "Sprachgesteuerte Bedienung, Echtzeit-Transkription, Flüstermodus mit Live-Tipps während Video-Interviews",
          tech: ["Whisper (lokal/API)", "Web Speech API", "TTS"],
        },
        {
          id: 6,
          title: "AI Resume Parser / CV-Scanner",
          status: "completed",
          icon: "📄",
          desc: "PDF hochladen → alle Felder automatisch ausfüllen, Skill-Extraktion, Gap-Analyse mit Stellenanzeigen",
          tech: ["GPT-4o / Claude", "PDF.js", "Strukturiertes Output-Parsing"],
        },
        {
          id: 7,
          title: "Autonomer Bewerbungs-Agent",
          status: "planned",
          icon: "🕵️",
          desc: "Sucht täglich neue Stellen (Indeed, LinkedIn, StepStone, Xing), bewertet Passung 0–100%, Digest-Report per E-Mail",
          tech: ["Python", "Playwright", "LLM-Scoring", "BullMQ / pg-boss"],
        },
      ],
    },
    {
      category: "📅 Kalender",
      color: "from-green-600 to-teal-600",
      bg: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-800",
      items: [
        {
          id: 8,
          title: "Smart-Kalender (KI-gestützt)",
          status: "planned",
          icon: "🗓️",
          desc: "Wochen-/Monats-/Agendaansicht, auto. Interviewtermine aus E-Mails, Google Calendar & Outlook bidirektional, iCal-Export",
          tech: ["FullCalendar.io (React)", "Google Calendar API", "Microsoft Graph API"],
        },
        {
          id: 9,
          title: "Interview-Vorbereitung Timeline",
          status: "planned",
          icon: "⏱️",
          desc: "Auto. Aufgabenliste: D-7 Recherche, D-3 Fragen, D-1 Test-Call, D-0 Checkliste + Push-Notifikationen",
          tech: ["PWA Push API", "Cron-Job", "PostgreSQL"],
        },
      ],
    },
    {
      category: "📊 Analytics & Reporting",
      color: "from-orange-600 to-yellow-600",
      bg: "bg-orange-50 border-orange-200",
      badge: "bg-orange-100 text-orange-800",
      items: [
        {
          id: 10,
          title: "Predictive Analytics (ML-basiert)",
          status: "planned",
          icon: "🔮",
          desc: "Vorhersage Erfolgschance pro Bewerbung (z.B. 73%), basiert auf Branche, Größe, Reaktionszeit, Historik",
          tech: ["scikit-learn", "TensorFlow.js", "PostgreSQL ML"],
        },
        {
          id: 11,
          title: "Bewerbungs-Heatmap & Netzwerk-Graph",
          status: "completed",
          icon: "🌍",
          desc: "Interaktive Weltkarte aller Bewerbungen, Netzwerk-Graph: Kontakte → Firmen → Bewerbungen visualisiert",
          tech: ["D3.js", "Recharts", "Leaflet.js"],
        },
      ],
    },
    {
      category: "💬 Echtzeit & Collaboration",
      color: "from-pink-600 to-rose-600",
      bg: "bg-pink-50 border-pink-200",
      badge: "bg-pink-100 text-pink-800",
      items: [
        {
          id: 12,
          title: "Echtzeit-Collaboration",
          status: "planned",
          icon: "👥",
          desc: "Kanban mit Live-Cursor mehrerer Nutzer, Kommentare & @Erwähnungen auf Bewerbungen",
          tech: ["Socket.io", "Partykit", "CRDT"],
        },
        {
          id: 13,
          title: "Mentoring-Chat / Coaching-Platform",
          status: "planned",
          icon: "🎓",
          desc: "Mentoren finden & per Chat kontaktieren, Video-Call direkt in der App (WebRTC)",
          tech: ["WebRTC (Peer.js)", "WebSocket-Chat", "PostgreSQL"],
        },
      ],
    },
    {
      category: "📧 Integrationen",
      color: "from-indigo-600 to-violet-600",
      bg: "bg-indigo-50 border-indigo-200",
      badge: "bg-indigo-100 text-indigo-800",
      items: [
        {
          id: 14,
          title: "E-Mail-Integration (Gmail / Outlook)",
          status: "planned",
          icon: "✉️",
          desc: "Alle Bewerbungs-E-Mails automatisch importieren, Absagen/Zusagen erkennen & Status aktualisieren, E-Mails direkt beantworten",
          tech: ["Gmail API", "Microsoft Graph API", "OAuth2"],
        },
        {
          id: 15,
          title: "LinkedIn / XING Profile Sync",
          status: "planned",
          icon: "🔗",
          desc: "Profildaten, Erfahrungen, Skills automatisch synchronisieren, Stellenanzeigen direkt importieren",
          tech: ["LinkedIn API", "Browser-Extension", "OAuth2"],
        },
        {
          id: 16,
          title: "Browser-Extension",
          status: "planned",
          icon: "🧩",
          desc: "Stellenanzeige auf beliebiger Website mit 1 Klick speichern, alle Felder automatisch extrahieren",
          tech: ["Chrome/Firefox Extension (Manifest V3)", "REST API"],
        },
        {
          id: 17,
          title: "Zapier / n8n / Make Webhooks",
          status: "planned",
          icon: "⚡",
          desc: "Trigger bei Statuswechsel → Slack, neuer Termin → Google Calendar, Angebot erhalten → Konfetti + Slack",
          tech: ["Outgoing Webhooks", "n8n (self-hosted)", "Make / Zapier"],
        },
      ],
    },
    {
      category: "🎮 Gamification & UX",
      color: "from-yellow-500 to-orange-500",
      bg: "bg-yellow-50 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800",
      items: [
        {
          id: 18,
          title: "Gamification-System",
          status: "planned",
          icon: "🏆",
          desc: "XP-Punkte für jede Aktivität, Badges (\"Erster Job-Antrag\", \"10 Bewerbungen\"), Tages-Streak, Leaderboard",
          tech: ["PostgreSQL (Achievements)", "React Confetti", "WebSockets"],
        },
        {
          id: 19,
          title: "PWA + Mobile-First",
          status: "in-progress",
          icon: "📱",
          desc: "Als App installierbar, Offline-Modus (Service Worker), Push-Notifikationen, biometrische Anmeldung",
          tech: ["Service Worker", "Web Push API", "WebAuthn (Biometrie)"],
        },
        {
          id: 20,
          title: "AR Interview-Simulation (WebXR)",
          status: "planned",
          icon: "🥽",
          desc: "VR-Raum für Interview-Training, virtueller Interviewer als 3D-Modell",
          tech: ["WebXR API", "Three.js", "React Three Fiber"],
        },
      ],
    },
    {
      category: "🔧 Developer & Infrastruktur",
      color: "from-slate-600 to-gray-700",
      bg: "bg-slate-50 border-slate-200",
      badge: "bg-slate-100 text-slate-800",
      items: [
        {
          id: 21,
          title: "Vollständige REST + GraphQL API",
          status: "planned",
          icon: "🛠️",
          desc: "Öffentliche API für Drittanbieter, API-Key-Management im User-Profil, SDK (TypeScript / Python)",
          tech: ["Next.js API Routes", "GraphQL (Pothos)", "API-Key Auth"],
        },
        {
          id: 22,
          title: "Multi-Tenancy (Teams / Organisationen)",
          status: "planned",
          icon: "🏢",
          desc: "Organisationen & Teams anlegen, Recruiter verwaltet mehrere Kandidaten, Rollen: Owner, Admin, Member, Viewer",
          tech: ["PostgreSQL Row-Level-Security", "Prisma", "RBAC"],
        },
        {
          id: 23,
          title: "Audit-Log & DSGVO-Export",
          status: "planned",
          icon: "📋",
          desc: "Vollständiges Aktionsprotokoll, \"Meine Daten exportieren\" (ZIP), \"Account löschen\" (DSGVO-konformes Soft-Delete)",
          tech: ["PostgreSQL", "JSON-Export", "Soft-Delete Pattern"],
        },
      ],
    },
    {
      category: "🧠 Lokale LLM-Integration (On-Device AI)",
      color: "from-violet-600 to-purple-700",
      bg: "bg-violet-50 border-violet-200",
      badge: "bg-violet-100 text-violet-800",
      items: [
        {
          id: 24,
          title: "Ollama LLM-Backend (Lokal, 100% privat)",
          status: "planned",
          icon: "🦙",
          desc: "Lokale LLMs auswählen & wechseln: Llama 3.3, Mistral, Qwen2.5, DeepSeek-R1, Gemma3. Kein API-Key, keine Cloud, 100% offline – Deine Daten verlassen nie den Server.",
          tech: ["Ollama", "Llama 3.3", "Mistral 7B", "DeepSeek-R1", "Gemma3", "REST-API"],
        },
        {
          id: 25,
          title: "RAG – Retrieval-Augmented Generation",
          status: "planned",
          icon: "🔍",
          desc: "KI kennt deine gesamten Bewerbungsdaten: Lebensläufe, Anschreiben, Kontakte, Termine. Vektordatenbank durchsucht alle Dokumente semantisch und gibt der KI den perfekten Kontext.",
          tech: ["pgvector (PostgreSQL)", "LangChain.js", "Sentence Transformers", "Embeddings (nomic-embed-text)"],
        },
        {
          id: 26,
          title: "Model Router – Automatische Modellwahl",
          status: "planned",
          icon: "🎛️",
          desc: "Intelligentes Routing: schnelle Anfragen → kleines Modell (Gemma 2B), komplexe Analysen → großes Modell (Llama 3.3 70B). Kostenoptimierung bei Cloud-Hybrid.",
          tech: ["LiteLLM", "Ollama", "OpenAI API (Fallback)", "Anthropic Claude (Fallback)"],
        },
        {
          id: 27,
          title: "Structured Output / Function Calling",
          status: "planned",
          icon: "📐",
          desc: "KI gibt typsichere JSON-Antworten zurück (Zod-Schemas). Z.B.: KI analysiert Stellenanzeige → gibt strukturiert Gehalt, Skills, Anforderungen, Firma zurück.",
          tech: ["Zod", "LangChain Structured Output", "JSON Schema", "Ollama /api/chat"],
        },
        {
          id: 28,
          title: "Fine-Tuning auf eigene Daten",
          status: "planned",
          icon: "🎯",
          desc: "Modell auf eigene Bewerbungshistorie feintarieren: Erfolgreiche Anschreiben als Trainingsdaten → KI lernt deinen persönlichen Schreibstil. Lokal mit Unsloth/PEFT/LoRA.",
          tech: ["Unsloth", "LoRA / QLoRA", "PEFT", "Hugging Face Transformers", "GGUF Export"],
        },
      ],
    },
    {
      category: "🤖 Agentics & Multi-Agent Systems",
      color: "from-cyan-600 to-blue-700",
      bg: "bg-cyan-50 border-cyan-200",
      badge: "bg-cyan-100 text-cyan-800",
      items: [
        {
          id: 29,
          title: "LangGraph Multi-Agent Workflow",
          status: "planned",
          icon: "🕸️",
          desc: "Mehrere spezialisierte Agenten arbeiten parallel: Research-Agent sucht Firmeninfos, Writer-Agent formuliert Anschreiben, Reviewer-Agent prüft Qualität, Scheduler-Agent plant Termine.",
          tech: ["LangGraph", "LangChain", "Ollama", "Tool-Calling", "Agent Memory"],
        },
        {
          id: 30,
          title: "AutoGen Agenten-Framework",
          status: "planned",
          icon: "⚙️",
          desc: "Microsoft AutoGen: Agenten diskutieren untereinander, geben sich gegenseitig Feedback, verbessern Anschreiben iterativ bis zur Perfektion – vollautomatisch.",
          tech: ["Microsoft AutoGen", "Python", "FastAPI", "WebSocket"],
        },
        {
          id: 31,
          title: "Crew AI – Spezialisierte Agenten-Teams",
          status: "planned",
          icon: "👨‍👩‍👧‍👦",
          desc: "Job-Scout-Agent, HR-Analyst-Agent, Letter-Writer-Agent, Interview-Coach-Agent bilden ein Team. Jeder Agent hat eigene Rolle, Ziel und Werkzeuge.",
          tech: ["CrewAI", "Ollama", "Playwright Tools", "Memory (Chroma)"],
        },
        {
          id: 32,
          title: "Autonome Bewerbungs-Pipeline",
          status: "planned",
          icon: "🏭",
          desc: "Vollautomatische Pipeline: Job gefunden → Firma recherchiert → CV angepasst → Anschreiben generiert → Qualität geprüft → User-Freigabe → Absenden. Human-in-the-Loop bei jeder Stufe.",
          tech: ["LangGraph", "BullMQ", "Playwright", "PDF-Generator", "Nodemailer"],
        },
      ],
    },
    {
      category: "🗣️ Speech & Multimodal AI",
      color: "from-rose-600 to-pink-700",
      bg: "bg-rose-50 border-rose-200",
      badge: "bg-rose-100 text-rose-800",
      items: [
        {
          id: 33,
          title: "Whisper – Lokale Spracherkennung",
          status: "planned",
          icon: "🎤",
          desc: "OpenAI Whisper lokal: Diktiere Notizen, Bewerbungsideen, Interview-Antworten per Sprache. Automatische Transkription + Punctuation + Sprechererkennung.",
          tech: ["Whisper.cpp (lokal)", "faster-whisper", "WebRTC Audio", "Web Speech API"],
        },
        {
          id: 34,
          title: "Kokoro TTS – Lokale Text-to-Speech",
          status: "planned",
          icon: "🔊",
          desc: "Hochwertige lokale TTS: KI-Assistent spricht Feedback, Interview-Coach gibt Antworten per Stimme. Verschiedene Stimmen, Geschwindigkeiten, Emotionen – 100% lokal.",
          tech: ["Kokoro-82M", "Piper TTS", "Web Audio API", "Streaming"],
        },
        {
          id: 35,
          title: "Vision AI – Dokumenten-OCR & Analyse",
          status: "planned",
          icon: "👁️",
          desc: "Multimodales LLM: Foto von gedrucktem Lebenslauf → automatisch digitalisiert. Screenshot einer Stellenanzeige → alle Daten extrahiert. Foto des Unternehmens-Logos → Firma erkannt.",
          tech: ["LLaVA / Qwen2-VL", "Ollama (Vision)", "Tesseract OCR", "PDF.js"],
        },
        {
          id: 36,
          title: "Realtime Voice AI Interview-Training",
          status: "planned",
          icon: "🎧",
          desc: "Sprich direkt mit dem KI-Interviewer: Frage per Mikrofon → Whisper transkribiert → LLM antwortet → TTS spricht. Unterbrechbar, natürlicher Dialog, Echtzeit-Feedback zu Stimmlage & Fachlichkeit.",
          tech: ["Whisper.cpp", "Kokoro TTS", "Ollama", "WebRTC", "VAD (Voice Activity Detection)"],
        },
      ],
    },
    {
      category: "🧬 Neural Networks & ML on Device",
      color: "from-emerald-600 to-green-700",
      bg: "bg-emerald-50 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-800",
      items: [
        {
          id: 37,
          title: "Skill-Gap Neural Analyzer",
          status: "planned",
          icon: "📊",
          desc: "Neuronales Netz vergleicht deinen CV mit tausenden Stellenanzeigen: Fehlende Skills visualisiert, Lernpfad empfohlen (Udemy/Coursera-Links), Zeitaufwand geschätzt.",
          tech: ["TensorFlow.js", "ONNX Runtime Web", "Sentence Transformers", "Cosine Similarity"],
        },
        {
          id: 38,
          title: "Success Prediction ML Model",
          status: "planned",
          icon: "🔮",
          desc: "Trainiertes ML-Modell auf anonymisierten Bewerbungsdaten: Vorhersage Rückmeldequote, Interview-Einladungswahrscheinlichkeit, Gehaltsverhandlungsspielraum.",
          tech: ["scikit-learn (Python)", "ONNX Export", "TensorFlow.js", "Feature Engineering"],
        },
        {
          id: 39,
          title: "NLP Sentiment & Tone Analyzer",
          status: "planned",
          icon: "💬",
          desc: "Analysiert Ton deiner Anschreiben: Zu selbstsicher? Zu zurückhaltend? Zu förmlich? KI gibt konkrete Überarbeitungsvorschläge Satz für Satz.",
          tech: ["Transformers.js", "BERT / DistilBERT (ONNX)", "Sentiment Analysis", "Readability Scoring"],
        },
        {
          id: 40,
          title: "Anomaly Detection – Ungewöhnliche Muster",
          status: "planned",
          icon: "🚨",
          desc: "Erkennt verdächtige Muster in Stellenanzeigen: Fake-Jobs, Gehalts-Bait, unrealistische Anforderungen. Warnt bevor du dich bewirbst.",
          tech: ["Isolation Forest", "TensorFlow.js", "NLP Pattern Matching", "Job-DB Comparison"],
        },
      ],
    },
    {
      category: "🌐 Distributed & Edge AI",
      color: "from-amber-600 to-orange-700",
      bg: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-800",
      items: [
        {
          id: 41,
          title: "WebLLM – KI komplett im Browser",
          status: "planned",
          icon: "🌍",
          desc: "LLM läuft komplett im Browser via WebGPU: kein Server notwendig, Daten verlassen nie das Gerät. Llama 3.2 3B / Phi-3.5 mini im Browser – funktioniert offline.",
          tech: ["WebLLM (MLC AI)", "WebGPU", "WASM", "Phi-3.5 Mini / Llama 3.2 3B"],
        },
        {
          id: 42,
          title: "Federated Learning – Privacy-First ML",
          status: "planned",
          icon: "🔒",
          desc: "Modell trainiert auf deinen Daten lokal → nur Gradienten (keine Rohdaten) werden aggregiert. Alle Nutzer verbessern das Modell gemeinsam, ohne Daten zu teilen.",
          tech: ["TensorFlow Federated", "Flower (flwr)", "Differential Privacy", "Secure Aggregation"],
        },
        {
          id: 43,
          title: "Transformers.js – Zero-Server Inference",
          status: "planned",
          icon: "⚡",
          desc: "Hugging Face Transformers direkt im Browser: Named Entity Recognition, Text Classification, Zero-Shot Classification, Token Classification – alles client-seitig.",
          tech: ["Transformers.js", "ONNX Runtime Web", "WebWorker", "Hugging Face Hub"],
        },
      ],
    },
    {
      category: "🚀 Next-Gen & Experimentell",
      color: "from-fuchsia-600 to-purple-800",
      bg: "bg-fuchsia-50 border-fuchsia-200",
      badge: "bg-fuchsia-100 text-fuchsia-800",
      items: [
        {
          id: 44,
          title: "AI Memory-System (Langzeit-Gedächtnis)",
          status: "planned",
          icon: "🧩",
          desc: "KI erinnert sich dauerhaft an alle wichtigen Infos: Präferenzen, vergangene Interviews, Firmen die du gemocht oder abgelehnt hast – wie ein persönlicher Assistent der nie vergisst.",
          tech: ["mem0 (Memory Layer)", "pgvector", "Redis", "Episodic Memory"],
        },
        {
          id: 45,
          title: "AI-generierte Video-Bewerbung",
          status: "planned",
          icon: "🎬",
          desc: "KI erstellt automatisch ein professionelles Video-Anschreiben: Avatar spricht deinen Text, Hintergrund wird angepasst, Untertitel werden generiert, Export als MP4.",
          tech: ["HeyGen API / D-ID", "Eleven Labs", "FFmpeg", "DALL-E 3 (Hintergrund)"],
        },
        {
          id: 46,
          title: "Quantum-inspired Optimierung",
          status: "planned",
          icon: "⚛️",
          desc: "Quantum-Annealing-Algorithmen für das Matching-Problem: Optimale Bewerbungsstrategie berechnen (welche Jobs in welcher Reihenfolge, welche Ressourcen einsetzen).",
          tech: ["D-Wave Leap API", "Qiskit (IBM)", "SimulatedAnnealing.js", "QUBO-Formulierung"],
        },
        {
          id: 47,
          title: "Digital Twin – Dein KI-Doppelgänger",
          status: "planned",
          icon: "👤",
          desc: "KI-Modell das vollständig dein berufliches Profil repräsentiert: beantwortet Recruiter-Anfragen automatisch, nimmt an KI-Vorgesprächen teil, filtert unpassende Anfragen.",
          tech: ["Fine-tuning (LoRA)", "Persona Embedding", "Ollama", "API Gateway"],
        },
        {
          id: 48,
          title: "Neuromorphic Computing Interface",
          status: "planned",
          icon: "🔬",
          desc: "Zukunftsvision: Intel Loihi / IBM NorthPole für ultra-effiziente Inferenz. 1000x weniger Strom als GPU. Echtzeit-Sprachverarbeitung auf Embedded Hardware.",
          tech: ["Intel Loihi 2", "IBM NorthPole", "Nengo Framework", "Spiking Neural Networks"],
        },
      ],
    },
  ];

  const techStack = {
    frontend: [
      "Next.js 16.0.9 (App Router)",
      "React 19.2.1 (Server & Client Components)",
      "TypeScript 5 (Full Type Safety)",
      "Tailwind CSS 4 (Utility-first)",
      "Heroicons React (Enterprise Icons)",
    ],
    backend: ["Next.js API Routes", "Prisma ORM", "PostgreSQL", "PGAdmin"],
    testing: ["Jest", "Cypress", "React Testing Library"],
    deployment: ["Docker", "Docker Compose", "nginx", "GitHub Actions"],
    integrations: [
      "Zoom API",
      "Microsoft Graph",
      "Job Portal APIs",
      "Calendar APIs",
    ],
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      case "in-progress":
        return <CogIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case "planned":
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "current":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "upcoming":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "planned":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  /** Status-Override lesen */
  function getSt(key: string, def: string): string {
    return statusOverrides[key] ?? def;
  }

  /** Klickbarer 3-Zustand-Schieberegler */
  function StatusToggle({ id, def }: { id: string; def: string }) {
    const cur = getSt(id, def);
    const states = [
      { val: "planned",     label: "⏳ Geplant",   cls: "bg-slate-500 text-white" },
      { val: "in-progress", label: "🔄 In Arbeit",  cls: "bg-blue-500 text-white" },
      { val: "completed",   label: "✅ Fertig",     cls: "bg-green-500 text-white" },
    ];
    return (
      <div className="flex gap-1 mt-3 pt-2 border-t border-(--border)">
        {states.map(({ val, label, cls }) => (
          <button
            key={val}
            onClick={() => setStatusOverrides(prev => ({ ...prev, [id]: val }))}
            className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition ${
              cur === val ? cls : "bg-(--surface) text-(--muted) hover:text-foreground border border-(--border)"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--surface) text-foreground">
      {/* Header */}
      <header className="bg-(--card) shadow-sm border-b border-(--border)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                IT-Bewerbungs-Management-Tool
              </h1>
              <p className="text-lg text-(--muted) mt-2">
                Coming Soon - Revolutionäres Bewerbungsmanagement für IT-Profis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                In Entwicklung
              </span>
              <span className="text-sm text-(--muted)">
                Stand: 3. März 2026 - Phase 7 aktiv 🔄
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Vision & Mission */}
        <section className="bg-(--card) border border-(--border) rounded-xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Vision & Mission
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-blue-500 mb-4">
                🎯 Unsere Vision
              </h3>
              <p className="text-(--muted) leading-relaxed">
                Das ultimative Tool für IT-Bewerbungsmanagement zu schaffen, das
                Bewerbern hilft, ihre Karriere strukturiert und erfolgreich zu
                verwalten. Durch intelligente Automatisierung und nahtlose
                Integrationen möchten wir den Bewerbungsprozess revolutionieren.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-500 mb-4">
                🚀 Unsere Mission
              </h3>
              <p className="text-(--muted) leading-relaxed">
                IT-Profis dabei zu unterstützen, den Überblick über ihre
                Bewerbungsaktivitäten zu behalten, wichtige Termine nicht zu
                verpassen und durch professionelles Management mehr Erfolg bei
                Bewerbungen zu erzielen.
              </p>
            </div>
          </div>
        </section>

        {/* Geplante Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            🎨 Features & Entwicklungsstand
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const fSt = getSt(`f_${index}`, feature.status);
              return (
                <div
                  key={index}
                  className={`bg-(--card) border border-(--border) rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 ${
                    fSt === "completed"
                      ? "border-l-4 border-green-500"
                      : fSt === "in-progress"
                      ? "border-l-4 border-yellow-500"
                      : "border-l-4 border-gray-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(fSt)}
                      <span className="text-sm text-(--muted) font-medium">
                        {feature.phase}
                      </span>
                    </div>
                    {fSt === "completed" && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-2 py-1 rounded-full font-medium">
                        ✅ Fertig
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-(--muted) text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <StatusToggle id={`f_${index}`} def={feature.status} />
                </div>
              );
            })}
          </div>
        </section>

        {/* Futuristische Features Roadmap */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl font-bold text-gray-900">🚀 Futuristische Feature-Roadmap</h2>
            <span className="px-3 py-1 text-xs font-bold bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow">
              48 Features · Nach Priorität
            </span>
          </div>
          <p className="text-(--muted) text-sm mb-8">48 geplante Erweiterungen – von lokalen LLMs (Ollama/Llama) über Multi-Agent-Systeme bis hin zu Neuromorphic Computing und Digital Twins.</p>

          <div className="space-y-10">
            {futuristicFeatures.map((cat) => (
              <div key={cat.category}>
                {/* Kategorie-Header */}
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border`}>
                  <span className={`text-transparent bg-clip-text bg-linear-to-r ${cat.color}`}>{cat.category}</span>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {cat.items.map((item) => {
                    const iSt = getSt(`fi_${item.id}`, item.status);
                    return (
                      <div
                        key={item.id}
                        className={`relative bg-(--card) border border-(--border) rounded-xl shadow-sm hover:shadow-md transition-all p-5 ${
                          iSt === "completed" ? "border-l-4 border-green-500" :
                          iSt === "in-progress" ? "border-l-4 border-blue-500" :
                          "border-l-4 border-slate-600"
                        }`}
                      >
                        {/* Prioritäts-Badge */}
                        <span className="absolute top-3 right-3 text-xs font-bold text-(--muted)">Feature {item.id}</span>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{item.icon}</span>
                          <h3 className="font-semibold text-foreground text-sm leading-tight pr-6">{item.title}</h3>
                        </div>

                        <p className="text-(--muted) text-xs leading-relaxed mb-3">{item.desc}</p>

                        {/* Tech-Stack Badges */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tech.map((t) => (
                            <span key={t} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5 mb-1">
                          {iSt === "completed" && (
                            <><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                            <span className="text-xs text-green-500 font-medium">Abgeschlossen</span></>
                          )}
                          {iSt === "in-progress" && (
                            <><span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
                            <span className="text-xs text-blue-400 font-medium">In Entwicklung</span></>
                          )}
                          {iSt === "planned" && (
                            <><span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>
                            <span className="text-xs text-(--muted) font-medium">Geplant</span></>
                          )}
                        </div>
                        <StatusToggle id={`fi_${item.id}`} def={item.status} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Entwicklungsplan */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            📅 Entwicklungsplan
          </h2>
          <div className="space-y-8">
            {roadmap.map((phase, index) => {
              const rSt = getSt(`r_${index}`, phase.status);
              return (
                <div key={index} className="bg-(--card) border border-(--border) rounded-xl shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-xl font-bold text-foreground">
                        {phase.phase}
                      </h3>
                      <h4 className="text-lg text-(--muted)">{phase.title}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(rSt)}`}>
                        {rSt === "completed" && "✅ Abgeschlossen"}
                        {rSt === "in-progress" && "🔄 In Arbeit"}
                        {rSt === "current" && "🔥 Aktuell"}
                        {rSt === "upcoming" && "⏳ Bald"}
                        {rSt === "planned" && "📋 Geplant"}
                      </span>
                      <div className="flex gap-1">
                        {[
                          { val: "planned",     emoji: "⏳", title: "Geplant" },
                          { val: "in-progress", emoji: "🔄", title: "In Arbeit" },
                          { val: "completed",   emoji: "✅", title: "Fertig" },
                        ].map(({ val, emoji, title }) => (
                          <button
                            key={val}
                            title={title}
                            onClick={() => setStatusOverrides(prev => ({ ...prev, [`r_${index}`]: val }))}
                            className={`w-8 h-8 rounded-lg text-sm transition ${
                              rSt === val
                                ? val === "completed" ? "bg-green-500 text-white"
                                  : val === "in-progress" ? "bg-blue-500 text-white"
                                  : "bg-slate-500 text-white"
                                : "bg-(--surface) border border-(--border) text-(--muted) hover:text-foreground"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phase.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <span className="text-(--muted)">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Technologie-Stack */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            ⚡ Technologie-Stack
          </h2>
          <div className="bg-(--card) border border-(--border) rounded-xl shadow-sm p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(techStack).map(([category, technologies]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-foreground mb-4 capitalize">
                    {category === "frontend" && "🎨 Frontend"}
                    {category === "backend" && "⚙️ Backend"}
                    {category === "testing" && "🧪 Testing"}
                    {category === "deployment" && "🚀 Deployment"}
                    {category === "integrations" && "🔌 Integrationen"}
                  </h3>
                  <ul className="space-y-2">
                    {technologies.map((tech, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckIcon className="w-4 h-4 text-green-500" />
                        <span className="text-(--muted) text-sm">{tech}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Admin Panel Toggle */}
        <section className="bg-red-950/20 dark:bg-red-950/30 rounded-xl p-8 border border-red-800/40">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-red-400 mb-2">
                🛡️ Admin-Bereich
              </h2>
              <p className="text-red-300/80">
                Erweiterte Einstellungen und Projektverwaltung für
                Administratoren
              </p>
            </div>
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {showAdminPanel ? "Panel schließen" : "Admin Panel öffnen"}
            </button>
          </div>

          {showAdminPanel && (
            <div className="mt-6 pt-6 border-t border-red-800/30">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-3">
                    Projekt-Status
                  </h3>
                  <ul className="space-y-2 text-sm text-red-300/80">
                    <li>• ✅ Phase 1-4: Vollständig implementiert</li>
                    <li>• 🔄 Phase 5: Backend & API Integration aktiv</li>
                    <li>• 📊 Alle Core Module: 100% funktional</li>
                    <li>• 🎨 Enterprise UX/UI: Vollständig</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-3">
                    Implementierte Features
                  </h3>
                  <ul className="space-y-2 text-sm text-red-300/80">
                    <li>• 👥 Kontakte & Networking: Vollständig</li>
                    <li>• 📈 Reports & Analytics: Vollständig</li>
                    <li>• 🔐 Admin Panel: Enterprise-ready</li>
                    <li>• 🎯 Alle 6 Module: Online & funktional</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-(--card) border-t border-(--border) mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-foreground">
              © 2026 BW-Manage – Bewerbungsmanagement für IT-Profis
            </p>
            <p className="text-sm text-(--muted) mt-2">
              Next.js 16 · React 18 · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
