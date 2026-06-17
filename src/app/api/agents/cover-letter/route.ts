import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { scopedPrisma } from "@/lib/security/scope";

export interface CoverLetterResult {
  senderBlock: string;
  recipientBlock: string;
  date: string;
  subject: string;
  salutation: string;
  body: string;
  closing: string;
  fullText: string;
}

interface CoverLetterRequest {
  // Bewerbungsmodus
  mode?: "DIREKT" | "INITIATIV";        // DIREKT = auf Stelle, INITIATIV = Initiativbewerbung
  initiativPosition?: string;           // Gewünschter Bereich bei Initiativbewerbung
  // Muster-Anschreiben (optional) — wird analysiert und für neue Stelle adaptiert
  sampleLetter?: string;
  // Stellendaten
  position: string;
  company: string;
  companyAddress?: string;
  jobDescription?: string;
  requiredSkills?: string[];
  companyDescription?: string;
  benefits?: string[];
  // Absender (vom Benutzer ausgefüllt)
  senderName: string;
  senderStreet: string;
  senderZip: string;
  senderCity: string;
  senderPhone?: string;
  senderEmail?: string;
}

function buildPrompt(req: CoverLetterRequest, documents: string, applications: string): string {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const isInitiativ = req.mode === "INITIATIV";
  const hasSample = req.sampleLetter && req.sampleLetter.trim().length > 50;
  const targetPosition = isInitiativ
    ? (req.initiativPosition || req.position || "eine passende Position")
    : req.position;
  const subjectLine = isInitiativ
    ? `Initiativbewerbung – ${req.initiativPosition ? req.initiativPosition + " / " : ""}${req.company}`
    : `Bewerbung als ${req.position}`;

  const modeRules = isInitiativ ? `
INITIATIVBEWERBUNG — besondere Regeln:
- KEIN Bezug auf eine konkrete Stellenanzeige — es gibt keine
- Erkläre aktiv, warum gerade ${req.company} das Zielunternehmen ist
- Zeige was der Bewerber einbringt und welche Rolle er sich vorstellt: ${targetPosition}
- Signalisiere Flexibilität: „Ich bin offen für verschiedene Einsatzbereiche"
- Bitte um ein erstes Kennenlerngespräch, nicht um eine konkrete Stelle` : `
DIREKTBEWERBUNG auf ausgeschriebene Stelle:
- Beziehe dich auf die konkrete Stellenausschreibung der Position ${req.position}
- Zeige direkt wie die geforderten Skills exakt erfüllt werden
- Nenne 2+ konkrete Anforderungen aus der Stellenbeschreibung`;

  const sampleSection = hasSample ? `
=== MUSTER-ANSCHREIBEN DES BEWERBERS (ANALYSIEREN & ADAPTIEREN) ===
Der Bewerber hat folgendes eigenes Anschreiben als Vorlage eingereicht. Deine Aufgabe:
1. Analysiere Schreibstil, Ton, Struktur und persönliche Formulierungen des Musters
2. Übernehme den individuellen Schreibstil des Bewerbers (nicht generisch!)
3. Schreibe das Anschreiben inhaltlich NEU — zugeschnitten auf ${req.company} und die Stelle "${req.position}"
4. Verwende ähnliche Satzlängen, Wortwahl und Tonalität wie im Muster
5. Behalte persönliche Details aus dem Muster (Berufsjahre, spezifische Projekte, etc.) wenn sie zur Stelle passen
6. VERBESSERE schwache Formulierungen aus dem Muster — optimiere, adaptiere, schreibe nicht 1:1 ab

--- MUSTER-ANSCHREIBEN ANFANG ---
${req.sampleLetter!.trim().slice(0, 4000)}
--- MUSTER-ANSCHREIBEN ENDE ---
` : "";

  return `Du bist ein erstklassiger Bewerbungsschreiber für IT-Fachkräfte.
Schreibe ein professionelles, überzeugendes ${isInitiativ ? "INITIATIVBEWERBUNGS-Anschreiben" : "Bewerbungsanschreiben"} nach DIN-5008-Norm auf Deutsch.
${hasSample ? "⚡ WICHTIG: Ein Muster-Anschreiben wurde bereitgestellt — analysiere Stil und adaptiere ihn!" : ""}

=== BEWERBUNGSMODUS ===
${isInitiativ ? "🔵 INITIATIVBEWERBUNG — keine ausgeschriebene Stelle" : "🟢 DIREKTBEWERBUNG — auf konkret ausgeschriebene Stelle"}
${modeRules}

=== BEWERBER ===
Name: ${req.senderName}
Adresse: ${req.senderStreet}, ${req.senderZip} ${req.senderCity}
Telefon: ${req.senderPhone || "—"}
E-Mail: ${req.senderEmail || "—"}

=== UNTERNEHMEN & STELLE ===
Unternehmen: ${req.company}
Adresse: ${req.companyAddress || req.company}
Über das Unternehmen: ${req.companyDescription || "Führendes Technologieunternehmen im DACH-Raum"}
${isInitiativ ? `Gewünschter Bereich: ${targetPosition}` : `Position: ${req.position}`}
Stellenbeschreibung: ${req.jobDescription || "Nicht angegeben"}
Relevante Skills: ${req.requiredSkills?.join(", ") || "Nicht angegeben"}
Benefits / Vorteile: ${req.benefits?.join(", ") || "Nicht angegeben"}

=== BISHERIGE BEWERBUNGEN (Kontext) ===
${applications || "Keine vorhanden"}

=== HOCHGELADENE UNTERLAGEN ===
${documents || "Keine"}
${sampleSection}
=== ALLGEMEINE REGELN ===
1. DIN-5008-konform: Absender, Empfänger, Datum, Betreff, Anrede, 3-4 Absätze, Grußformel
2. PFLICHT: Nenne ${req.company} und ${isInitiativ ? "den Wunschbereich" : "die Position"} EXPLIZIT
3. PFLICHT: Erwähne etwas Spezifisches über ${req.company} (Branche, Produkte, Marktstellung)
4. Keine Floskeln — konkrete Belege statt leere Phrasen
5. Ton: professionell, selbstsicher, präzise
6. Jede Version: ANDERER Einstieg und Argumentationsstil
${hasSample ? "7. STIL-ANPASSUNG: Orientiere dich am persönlichen Schreibstil des Muster-Anschreibens" : ""}

Antworte AUSSCHLIESSLICH als JSON ohne Codeblock:
{
  "senderBlock": "Name\\nStraße\\nPLZ Ort\\nTelefon | E-Mail",
  "recipientBlock": "Firmenname\\nAdresse",
  "date": "${today}",
  "subject": "${subjectLine}",
  "salutation": "Sehr geehrte Damen und Herren,",
  "body": "Absatz 1\\n\\nAbsatz 2\\n\\nAbsatz 3\\n\\nAbsatz 4",
  "closing": "Mit freundlichen Grüßen\\n\\n${req.senderName}",
  "fullText": "kompletter Brief als ein String mit \\n\\n zwischen Blöcken"
}`;
}

function buildFallback(req: CoverLetterRequest): CoverLetterResult {
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const skills = req.requiredSkills?.slice(0, 3).join(", ") || "modernen Technologien";
  const isInitiativ = req.mode === "INITIATIV";
  const targetPos = isInitiativ ? (req.initiativPosition || req.position) : req.position;

  const sender = `${req.senderName}\n${req.senderStreet}\n${req.senderZip} ${req.senderCity}${req.senderPhone ? `\n${req.senderPhone}` : ""}${req.senderEmail ? ` | ${req.senderEmail}` : ""}`;
  const recipient = `${req.company}\n${req.companyAddress || req.company}`;
  const subject = isInitiativ
    ? `Initiativbewerbung${req.initiativPosition ? ` – ${req.initiativPosition}` : ""} – ${req.company}`
    : `Bewerbung als ${req.position}`;
  const salutation = `Sehr geehrte Damen und Herren,`;

  const body = isInitiativ
    ? `mit großem Interesse verfolge ich die Entwicklung von ${req.company} und bewerbe mich hiermit initiativ für eine Position im Bereich ${targetPos}. ${req.companyDescription ? req.companyDescription + " " : ""}Dieses Profil entspricht genau meiner beruflichen Ausrichtung.

In meiner Laufbahn habe ich fundierte Erfahrungen mit ${skills} aufgebaut. Ich bringe nicht nur technisches Know-how mit, sondern auch die Fähigkeit, mich schnell in neue Strukturen einzufinden und aktiv zum Teamerfolg beizutragen. Die Kombination aus analytischem Denken und lösungsorientiertem Arbeiten zeichnet mich besonders aus.

Ich bin überzeugt, dass meine Kenntnisse und meine Arbeitsweise gut zu ${req.company} passen — ich bin offen für verschiedene Einsatzbereiche und freue mich auf ein erstes Kennenlerngespräch, in dem wir gemeinsam herausfinden können, wo ich den größten Mehrwert bieten kann.

Für Rückfragen stehe ich Ihnen jederzeit gern zur Verfügung.`
    : `mit großem Interesse habe ich Ihre Stellenanzeige für die Position als ${req.position} bei ${req.company} gelesen. Die Kombination aus innovativem Umfeld und anspruchsvollen technischen Herausforderungen motiviert mich, mich bei Ihnen zu bewerben.

In meiner bisherigen Tätigkeit habe ich fundierte Erfahrungen mit ${skills} gesammelt. Dabei habe ich nicht nur technische Lösungen entwickelt, sondern aktiv zur kontinuierlichen Verbesserung von Prozessen und zur Teamkommunikation beigetragen. Besonders am Herzen liegt mir die Qualität des Codes sowie die Zusammenarbeit in agilen Teams.

${req.company} überzeugt mich durch seinen Ruf als innovatives Technologieunternehmen mit klarer Vision. Ich bin davon überzeugt, mit meinen Kenntnissen und meiner Leidenschaft für Softwareentwicklung einen echten Mehrwert für Ihr Team leisten zu können.

Ich freue mich auf ein persönliches Gespräch, in dem ich Ihnen meine Motivation und meine Eignung für diese Position näher vorstellen darf. Für Rückfragen stehe ich Ihnen jederzeit gern zur Verfügung.`;

  const closing = `Mit freundlichen Grüßen\n\n${req.senderName}`;
  const fullText = `${sender}\n\n${recipient}\n\n${today}\n\n${subject}\n\n${salutation}\n${body}\n\n${closing}`;

  return { senderBlock: sender, recipientBlock: recipient, date: today, subject, salutation, body, closing, fullText };
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const rl = enforceRateLimit(request, "agents:cover-letter", { max: 20, windowMs: 3_600_000 });
    if (rl) return rl;

    const req = await request.json() as CoverLetterRequest;
    if (!req.position || !req.company || !req.senderName) {
      return NextResponse.json({ error: "position, company und senderName sind Pflichtfelder" }, { status: 400 });
    }

    const db = scopedPrisma(user.id);
    const [allDocs, allApps] = await Promise.all([
      db.document.findMany({ select: { name: true, type: true } }),
      db.application.findMany({
        select: { position: true, companyName: true, status: true },
        orderBy: { appliedAt: "desc" },
      }),
    ]);

    const documents = allDocs.slice(0, 10).map((d: { name: string; type: string }) => `${d.type}: ${d.name}`).join(", ");
    const applications = allApps.slice(0, 10).map((a: { position: string; companyName: string; status: string }) => `${a.position} bei ${a.companyName} (${a.status})`).join("; ");

    // Absender-E-Mail aus Session falls nicht angegeben
    if (!req.senderEmail) req.senderEmail = user.email;
    if (!req.senderName) req.senderName = user.name ?? user.email;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json(buildFallback(req));

    const prompt = buildPrompt(req, documents, applications);

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) return NextResponse.json(buildFallback(req));

    const aiData = await aiRes.json() as { content: { type: string; text: string }[] };
    const raw = aiData.content[0]?.text?.trim() ?? "";
    const parsed = JSON.parse(raw) as CoverLetterResult;
    return NextResponse.json(parsed);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "KI-Antwort konnte nicht verarbeitet werden" }, { status: 502 });
    }
    return handleGuardError(err);
  }
}
