import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";

export interface ScannedJob {
  position: string;
  department?: string;
  location?: string;
  workType?: string;
  salaryInfo?: string;
  description?: string;
  applyUrl?: string;
  companyName?: string;
  companyAddress?: string;
}

export interface ScanResult {
  company: string;
  companyAddress?: string;
  companyDescription?: string;
  jobs: ScannedJob[];
  scannedUrl: string;
  jobCount: number;
}

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BW-Manage-JobBot/1.0; +https://bw-manage.vercel.app)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} beim Laden der Seite`);

  const html = await res.text();

  // HTML → reiner Text
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s{3,}/g, "\n")
    .trim()
    .slice(0, 14000);

  return text;
}

function buildScanPrompt(pageText: string, url: string): string {
  const domain = new URL(url).hostname.replace("www.", "");

  return `Du bist ein spezialisierter Web-Scraping-Agent für Stellenanzeigen.

Analysiere den folgenden Website-Text einer Unternehmens-Karriereseite und extrahiere ALLE Stellenangebote.

URL: ${url}
Domain: ${domain}

=== SEITENINHALT ===
${pageText}

=== AUFGABE ===
1. Erkenne den Firmennamen und die Unternehmensadresse aus dem Text
2. Extrahiere ALLE Stellenangebote die du findest (auch Initiativbewerbungen)
3. Für jede Stelle: Position, Abteilung (wenn vorhanden), Standort, Arbeitsmodell, Gehalt (wenn angegeben), Kurzbeschreibung, Bewerbungs-URL

Antworte AUSSCHLIESSLICH als JSON:
{
  "company": "Firmenname",
  "companyAddress": "Straße, PLZ Ort",
  "companyDescription": "1-2 Sätze über das Unternehmen aus dem Text",
  "jobs": [
    {
      "position": "Stellenbezeichnung",
      "department": "Abteilung oder Team",
      "location": "Standort",
      "workType": "Remote / Hybrid / Vor Ort",
      "salaryInfo": "Gehaltsangabe wenn vorhanden",
      "description": "2-3 Sätze zur Stelle",
      "applyUrl": "Direktlink zur Bewerbung wenn vorhanden"
    }
  ],
  "jobCount": 5
}

Wenn du keine Stellenangebote findest, gib "jobs": [] zurück.
Wenn keine Adresse erkennbar: "companyAddress": null.`;
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const rl = enforceRateLimit(request, "agents:url-scanner", {
      max: 30,
      windowMs: 3_600_000,
    });
    if (rl) return rl;

    const body = await request.json() as { url?: string };
    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json({ error: "url ist ein Pflichtfeld" }, { status: 400 });
    }

    // URL validieren
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url.startsWith("http") ? body.url : `https://${body.url}`);
    } catch {
      return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });
    }

    // Blocklist: keine internen/privaten Adressen
    const hostname = parsedUrl.hostname;
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".internal")
    ) {
      return NextResponse.json({ error: "Diese URL ist nicht erlaubt" }, { status: 400 });
    }

    void user; // User für Logging vorhanden, aber hier nicht weiter benötigt

    // Seite abrufen
    let pageText: string;
    try {
      pageText = await fetchPageText(parsedUrl.toString());
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : "Seite nicht erreichbar";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    if (pageText.trim().length < 100) {
      return NextResponse.json(
        { error: "Seite konnte nicht gelesen werden (zu wenig Inhalt — möglicherweise JavaScript-Only)" },
        { status: 422 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "KI-Analyse nicht verfügbar (kein API-Key)" },
        { status: 503 }
      );
    }

    const prompt = buildScanPrompt(pageText, parsedUrl.toString());

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ error: "KI-Analyse fehlgeschlagen" }, { status: 502 });
    }

    const aiData = await aiRes.json() as { content: { type: string; text: string }[] };
    const raw = aiData.content[0]?.text?.trim() ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Keine strukturierten Daten aus der Seite extrahiert" }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as ScanResult;
    parsed.scannedUrl = parsedUrl.toString();

    return NextResponse.json(parsed);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Seite enthält kein lesbares Stellenangebot" }, { status: 422 });
    }
    return handleGuardError(err);
  }
}
