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

  return `Du bist ein erstklassiger Bewerbungsschreiber für IT-Fachkräfte.
Schreibe ein professionelles, überzeugendes Bewerbungsanschreiben nach DIN-5008-Norm auf Deutsch.

=== BEWERBER ===
Name: ${req.senderName}
Adresse: ${req.senderStreet}, ${req.senderZip} ${req.senderCity}
Telefon: ${req.senderPhone || "—"}
E-Mail: ${req.senderEmail || "—"}

=== STELLE ===
Position: ${req.position}
Unternehmen: ${req.company}
Adresse Unternehmen: ${req.companyAddress || req.company}
Über das Unternehmen: ${req.companyDescription || "Führendes Technologieunternehmen im DACH-Raum"}
Stellenbeschreibung: ${req.jobDescription || "Nicht angegeben"}
Geforderte Skills: ${req.requiredSkills?.join(", ") || "Nicht angegeben"}
Benefits / Vorteile: ${req.benefits?.join(", ") || "Nicht angegeben"}

=== BISHERIGE BEWERBUNGEN (Kontext) ===
${applications || "Keine vorhanden"}

=== HOCHGELADENE UNTERLAGEN ===
${documents || "Keine"}

=== REGELN ===
1. DIN-5008-konform: Absender, Empfänger, Datum, Betreff, Anrede, 3-4 Absätze, Grußformel
2. PFLICHT: Nenne das Unternehmen ${req.company} und die Position ${req.position} EXPLIZIT im Brief
3. PFLICHT: Beziehe dich auf mindestens 2 konkrete Anforderungen oder Benefits aus den Stellendetails
4. PFLICHT: Erwähne etwas Spezifisches über ${req.company} (Branche, Größe, Marktposition, Produkte)
5. Keine Floskeln ("teamfähig", "kommunikativ", "motiviert") — stattdessen konkrete Belege
6. Einstiegsabsatz: Warum genau DIESES Unternehmen + DIESE Stelle — spezifisch, nicht generisch
7. Hauptteil: Qualifikationen mit Bezug zu den geforderten Skills, bisherige Bewerbungen als Kontext
8. Schluss: Konkreter Gesprächswunsch, Verfügbarkeit
9. Ton: professionell, selbstsicher, präzise — kein Marketing-Speak
10. Jede Version soll einen ANDEREN Stil/Einstieg haben (bei Neu-Generierung)

Antworte AUSSCHLIESSLICH als JSON ohne Codeblock:
{
  "senderBlock": "Name\\nStraße\\nPLZ Ort\\nTelefon | E-Mail",
  "recipientBlock": "Firmenname\\nAdresse",
  "date": "${today}",
  "subject": "Bewerbung als [Position]",
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

  const sender = `${req.senderName}\n${req.senderStreet}\n${req.senderZip} ${req.senderCity}${req.senderPhone ? `\n${req.senderPhone}` : ""}${req.senderEmail ? ` | ${req.senderEmail}` : ""}`;
  const recipient = `${req.company}\n${req.companyAddress || req.company}`;
  const subject = `Bewerbung als ${req.position}`;
  const salutation = `Sehr geehrte Damen und Herren,`;

  const body = `mit großem Interesse habe ich Ihre Stellenanzeige für die Position als ${req.position} bei ${req.company} gelesen. Die Kombination aus innovativem Umfeld und anspruchsvollen technischen Herausforderungen motiviert mich, mich bei Ihnen zu bewerben.

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
