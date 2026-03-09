/**
 * AI INTERVIEW SIMULATOR
 *
 * LLM-gestützter adaptiver Interviewsimulator der sich an echte Benutzerdaten anpasst:
 *  - Fragen passen sich an die konkrete Stelle + Bewerbungskontext an
 *  - Echtzeit-Feedback: Filler-Words, STAR-Methode, Sentiment, Pace
 *  - Lokaler Betrieb (Ollama) oder API-Modus – User wählt
 *
 * Sicherheit:
 *  - Bewerbungsinhalt wird NICHT an externe APIs gesendet (lokaler Modus)
 *  - Alle Interview-Nachrichten bleiben lokal in der DB
 *  - Optionale Löschung der Session nach Abschluss
 *
 * Produktions-Stack:
 *  - Lokaler LLM: Ollama + llama3.2 / mistral-nemo
 *  - STT: OpenAI Whisper (lokal)
 *  - TTS: Kokoro-TTS (lokal, ONNX)
 */

export type InterviewDifficulty = "EASY" | "MEDIUM" | "HARD";
export type InterviewPhase = "INTRO" | "TECHNICAL" | "BEHAVIORAL" | "WRAP_UP";

export interface InterviewContext {
  jobTitle: string;
  company: string;
  difficulty: InterviewDifficulty;
  mode?: string; // Interview mode ('practice' | 'assessment' | 'simulation')
  userProfileSummary?: string; // Kurzzusammenfassung des Profils (lokal generiert)
  requirements?: string;
}

export interface InterviewMessage {
  role: "interviewer" | "candidate";
  content: string;
  phase?: InterviewPhase;
  metrics?: MessageMetrics;
}

export interface MessageMetrics {
  fillerWords: number;          // Zählung: "ähm", "also", "halt"...
  starMethodDetected: boolean;  // Situation, Task, Action, Result
  sentiment: number;            // -1.0 bis 1.0
  wordCount: number;
  avgWordsPerSentence: number;
  confidence: number;           // 0–1, basierend auf Assertivität
}

export interface InterviewFeedback {
  overallScore: number;         // 0–100
  categories: {
    technicalDepth: number;     // Technische Tiefe
    communication: number;      // Kommunikationsstärke
    starMethodUsage: number;    // STAR-Methoden-Anwendung
    confidence: number;         // Selbstsicherheit
    relevance: number;          // Relevanz der Antworten
  };
  strengths: string[];
  improvements: string[];
  sampleAnswers: Array<{
    question: string;
    betterAnswer: string;
  }>;
}

// ─── Filler-Word-Detektion ────────────────────────────────────────────────────

const FILLER_WORDS_DE = [
  "ähm", "äh", "hmm", "also", "halt", "irgendwie", "eigentlich",
  "sozusagen", "quasi", "naja", "ja", "oder so", "und so",
];

const FILLER_WORDS_EN = [
  "um", "uh", "like", "you know", "basically", "literally",
  "actually", "honestly", "right", "so", "kind of", "sort of",
];

export function countFillerWords(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const fw of [...FILLER_WORDS_DE, ...FILLER_WORDS_EN]) {
    const regex = new RegExp(`\\b${fw}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

// ─── STAR-Methode Detection ─────────────────────────────────────────────────

export function detectStarMethod(text: string): boolean {
  const lower = text.toLowerCase();
  const hasSituation = /situation|kontext|hintergrund|damals|als ich/.test(lower);
  const hasTask = /aufgabe|ziel|herausforderung|verantwortlich|zuständig/.test(lower);
  const hasAction = /hab(e)? |habe ich|ging ich vor|maßnahme|lösung|entschieden|implementiert/.test(lower);
  const hasResult = /ergebnis|resultat|erfolg|reduziert|verbessert|erreicht|letztendlich/.test(lower);
  return [hasSituation, hasTask, hasAction, hasResult].filter(Boolean).length >= 3;
}

// ─── Sentiment Analyse (lokal, ohne externe API) ─────────────────────────────

const POSITIVE_WORDS = [
  "erfolgreich", "gelöst", "verbessert", "optimiert", "erreicht", "umgesetzt",
  "proud", "achieved", "improved", "solved", "excellent", "great",
];

const NEGATIVE_WORDS = [
  "problem", "schwierig", "failed", "mistake", "fehler", "versagt",
  "leider", "unfortunately", "challenge", "struggle",
];

export function analyzeSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE_WORDS) {
    if (lower.includes(w)) score += 0.1;
  }
  for (const w of NEGATIVE_WORDS) {
    if (lower.includes(w)) score -= 0.05;
  }
  return Math.max(-1, Math.min(1, score));
}

// ─── Message-Analyse ─────────────────────────────────────────────────────────

export function analyzeMessage(content: string): MessageMetrics {
  const words = content.trim().split(/\s+/);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  return {
    fillerWords: countFillerWords(content),
    starMethodDetected: detectStarMethod(content),
    sentiment: analyzeSentiment(content),
    wordCount: words.length,
    avgWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0,
    confidence: Math.max(0, Math.min(1, (300 - words.length) / 300 + analyzeSentiment(content))),
  };
}

// ─── System-Prompt Generator ─────────────────────────────────────────────────

export function buildSystemPrompt(ctx: InterviewContext, phase: InterviewPhase): string {
  const difficultyMap: Record<InterviewDifficulty, string> = {
    EASY: "einfaches Einsteiger-Niveau, supportiv und ermutigend",
    MEDIUM: "professionelles Niveau, sachlich und fokussiert",
    HARD: "anspruchsvolles Senior-Niveau, kritisch und herausfordernd",
  };

  const phaseInstructions: Record<InterviewPhase, string> = {
    INTRO: `Beginne mit einer freundlichen Vorstellung und bitte den Kandidaten, sich kurz vorzustellen. Frage nach Motivation für die Stelle "${ctx.jobTitle}" bei ${ctx.company}.`,
    TECHNICAL: `Stelle 2–3 technische Fragen basierend auf den Anforderungen: ${ctx.requirements ?? "allgemeine IT-Kompetenzen"}. Fordere konkrete Beispiele.`,
    BEHAVIORAL: `Stelle Verhaltens-Fragen nach der STAR-Methode (Situation, Task, Action, Result). Fokus auf Teamarbeit, Konfliktlösung, Lernbereitschaft.`,
    WRAP_UP: `Gib dem Kandidaten Gelegenheit, eigene Fragen zu stellen. Schließe das Interview freundlich ab.`,
  };

  return `Du bist ein erfahrener ${ctx.difficulty === "HARD" ? "Senior" : ""} Recruiter bei ${ctx.company} und führst ein Vorstellungsgespräch für die Stelle "${ctx.jobTitle}".

Schwierigkeitsgrad: ${difficultyMap[ctx.difficulty]}

Aktuelle Interview-Phase: ${phaseInstructions[phase]}

WICHTIG: 
- Stelle immer nur EINE Frage auf einmal
- Reagiere auf die Antwort des Kandidaten bevor du zur nächsten Frage gehst
- Bleibe professionell und realistisch
- Antworte IMMER auf Deutsch
- Maximal 3–4 Sätze pro Antwort`;
}

// ─── Feedback-Generator ───────────────────────────────────────────────────────

export function generateFeedback(messages: InterviewMessage[]): InterviewFeedback {
  const candidateMessages = messages.filter((m) => m.role === "candidate");

  if (candidateMessages.length === 0) {
    return {
      overallScore: 0,
      categories: { technicalDepth: 0, communication: 0, starMethodUsage: 0, confidence: 0, relevance: 0 },
      strengths: [],
      improvements: ["Keine Antworten vorhanden"],
      sampleAnswers: [],
    };
  }

  const metrics = candidateMessages.map((m) =>
    m.metrics ?? analyzeMessage(m.content)
  );

  const avgFillerWords = metrics.reduce((s, m) => s + m.fillerWords, 0) / metrics.length;
  const starCount = metrics.filter((m) => m.starMethodDetected).length;
  const avgSentiment = metrics.reduce((s, m) => s + m.sentiment, 0) / metrics.length;
  const avgWordCount = metrics.reduce((s, m) => s + m.wordCount, 0) / metrics.length;
  const avgConfidence = metrics.reduce((s, m) => s + m.confidence, 0) / metrics.length;

  const communication = Math.min(100, Math.max(0,
    70 - avgFillerWords * 5 + avgSentiment * 20 + Math.min(20, avgWordCount / 5)
  ));
  const starMethodUsage = Math.min(100, (starCount / Math.max(1, candidateMessages.length)) * 100);
  const confidence = Math.min(100, avgConfidence * 100);
  const technicalDepth = Math.min(100, avgWordCount / 3);
  const relevance = Math.min(100, 50 + avgSentiment * 30 + starMethodUsage * 0.2);

  const overallScore = Math.round(
    (communication + starMethodUsage + confidence + technicalDepth + relevance) / 5
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (communication >= 70) strengths.push("Klare und verständliche Kommunikation");
  if (starMethodUsage >= 50) strengths.push("Gute Anwendung der STAR-Methode");
  if (avgSentiment > 0.2) strengths.push("Positiver, professioneller Ton");
  if (avgWordCount >= 80) strengths.push("Ausführliche und detaillierte Antworten");

  if (avgFillerWords > 3) improvements.push(`Füllwörter reduzieren (Ø ${avgFillerWords.toFixed(0)} pro Antwort)`);
  if (starMethodUsage < 30) improvements.push("STAR-Methode häufiger anwenden (Situation → Task → Action → Result)");
  if (avgWordCount < 40) improvements.push("Antworten ausführlicher gestalten – mehr Kontext und Beispiele");
  if (confidence < 0.4) improvements.push("Selbstsicher formulieren – weniger Konjunktiv, mehr Aussagen");

  return {
    overallScore,
    categories: {
      technicalDepth: Math.round(technicalDepth),
      communication: Math.round(communication),
      starMethodUsage: Math.round(starMethodUsage),
      confidence: Math.round(confidence),
      relevance: Math.round(relevance),
    },
    strengths,
    improvements,
    sampleAnswers: [],
  };
}

// ─── SESSION MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * Startet eine neue Interview-Session und erstellt den initialen Kontext
 */
export async function startInterviewSession(context: InterviewContext): Promise<{
  sessionId: string;
  firstQuestion: string;
  phase: InterviewPhase;
}> {
  const sessionId = `interview_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const phase: InterviewPhase = "INTRO";
  
  const firstQuestion = `Hallo! Schön, dass Sie sich für die Position als ${context.jobTitle} bei ${context.company} interessieren. Können Sie sich zunächst kurz vorstellen und mir erzählen, was Sie zu dieser Position motiviert?`;
  
  return {
    sessionId,
    firstQuestion,
    phase
  };
}

/**
 * Beendet eine Interview-Session und generiert das finale Feedback
 */
export async function endInterviewSession(sessionId: string, messages: InterviewMessage[]): Promise<{
  feedback: InterviewFeedback;
  sessionId: string;
  completedAt: string;
}> {
  const feedback = generateFeedback(messages);
  
  return {
    feedback,
    sessionId,
    completedAt: new Date().toISOString()
  };
}
