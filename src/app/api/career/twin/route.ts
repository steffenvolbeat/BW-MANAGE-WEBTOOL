import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";
import { enforceRateLimit } from "@/lib/security/rateLimit";

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-3-5-haiku-20241022", max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "{}";
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { appliedAt: "asc" },
      select: { id: true, companyName: true, position: true, status: true, appliedAt: true },
    });

    const stats = {
      total: applications.length,
      interviews: applications.filter((a) => ["INTERVIEW_SCHEDULED", "INTERVIEWED"].includes(a.status)).length,
      offers: applications.filter((a) => ["OFFER_RECEIVED", "ACCEPTED"].includes(a.status)).length,
      rejections: applications.filter((a) => a.status === "REJECTED").length,
      pending: applications.filter((a) => ["APPLIED", "REVIEWED"].includes(a.status)).length,
    };

    const timeline = applications.map((a) => ({
      date: a.appliedAt.toISOString(),
      type: "application",
      company: a.companyName,
      position: a.position,
      status: a.status,
    }));

    return NextResponse.json({ stats, timeline, twin: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Career Twin GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rl = enforceRateLimit(request, "ai:career-twin", { max: 5, windowMs: 60_000 });
    if (rl) return rl;
    const user = await getCurrentUser();

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      select: { companyName: true, position: true, status: true, appliedAt: true },
    });

    if (applications.length < 3) {
      return NextResponse.json({ error: "Mindestens 3 Bewerbungen benötigt." }, { status: 400 });
    }

    const companies = [...new Set(applications.map((a) => a.companyName))].slice(0, 15);
    const positions = [...new Set(applications.map((a) => a.position))].slice(0, 15);
    const statusCounts = applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});

    const stats = {
      total: applications.length,
      interviews: applications.filter((a) => ["INTERVIEW_SCHEDULED", "INTERVIEWED"].includes(a.status)).length,
      offers: applications.filter((a) => ["OFFER_RECEIVED", "ACCEPTED"].includes(a.status)).length,
      rejections: applications.filter((a) => a.status === "REJECTED").length,
      pending: applications.filter((a) => ["APPLIED", "REVIEWED"].includes(a.status)).length,
    };

    const prompt = `Du bist ein KI-Karriere-Analyst. Erstelle ein "Digital Career Twin" Profil:

Unternehmen: ${companies.join(", ")}
Positionen: ${positions.join(", ")}
Status: ${JSON.stringify(statusCounts)}
Gesamt: ${applications.length}

Antworte NUR mit validem JSON (kein Markdown):
{
  "level": "Junior/Mid/Senior/Lead/Executive",
  "archetype": "Der Innovator / Der Stratege / Der Experte",
  "strengths": ["Stärke 1", "Stärke 2", "Stärke 3"],
  "growthAreas": ["Bereich 1", "Bereich 2"],
  "careerTrajectory": "Beschreibung in 1-2 Sätzen",
  "nextSteps": ["Schritt 1", "Schritt 2", "Schritt 3", "Schritt 4"],
  "topCompanies": ["Firma 1", "Firma 2", "Firma 3"],
  "topSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "marketPosition": "Top 20% / Mittleres Segment",
  "salaryRange": "60.000–80.000 €"
}`;

    const text = await callClaude(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const twin = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return NextResponse.json({ twin, stats });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "UNAUTHORIZED" || msg === "INACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json({ error: "KI-Analyse nicht verfügbar (API-Key fehlt)" }, { status: 503 });
    }
    console.error("Career Twin POST error:", error);
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
  }
}
