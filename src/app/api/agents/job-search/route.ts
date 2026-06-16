/**
 * POST /api/agents/job-search
 * KI-gestützter Job-Such-Agent
 *
 * Liest Benutzerprofil + hochgeladene Dokumente, analysiert sie mit Claude
 * und liefert personalisierte Stellenangebote mit Match-Score zurück.
 *
 * Provider-Chain:
 *  1. Anthropic Claude  (ANTHROPIC_API_KEY)
 *  2. Lokaler Fallback  (regelbasiert)
 */

import { NextResponse } from "next/server";
import { requireActiveUser, handleGuardError } from "@/lib/security/guard";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { scopedPrisma } from "@/lib/security/scope";

// ── Typen ─────────────────────────────────────────────────────────────────────

export interface JobMatch {
  id: string;
  company: string;
  companySize: string;
  position: string;
  location: string;
  country: string;
  workType: "REMOTE" | "HYBRID" | "ONSITE";
  salaryMin: number;
  salaryMax: number;
  currency: string;
  matchScore: number;
  matchReasons: string[];
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  jobType: string;
  postedDaysAgo: number;
  applicationDeadline?: string;
  companyDescription: string;
  jobDescription: string;
  benefits: string[];
  applyUrl: string;
  isHighPriority: boolean;
}

export interface ProfileAnalysis {
  detectedSkills: string[];
  experienceLevel: string;
  strongAreas: string[];
  suggestions: string[];
  documentCount: number;
  applicationCount: number;
}

interface SearchPreferences {
  location: string;
  workType: "REMOTE" | "HYBRID" | "ONSITE" | "ANY";
  salaryMin: number;
  salaryMax: number;
  techStack: string[];
  jobLevel: "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "ANY";
  jobTypes: string[];
  countries: string[];
}

// ── System-Prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(
  userName: string,
  applicationSummary: string,
  documentList: string,
  prefs: SearchPreferences
): string {
  return `Du bist ein hochspezialisierter Job-Such-Agent für IT-Fachkräfte im DACH-Raum.
Deine Aufgabe: Analysiere das Benutzerprofil und generiere EXAKT 10 realistische, passende Stellenangebote.

=== BENUTZERPROFIL ===
Name: ${userName}
Bisherige Bewerbungen (Kontext): ${applicationSummary || "Keine vorhanden"}
Hochgeladene Dokumente: ${documentList || "Keine"}

=== SUCHPRÄFERENZEN ===
Standort: ${prefs.location || "Flexibel (DACH)"}
Arbeitsmodell: ${prefs.workType}
Gehaltsrahmen: ${prefs.salaryMin.toLocaleString("de")} – ${prefs.salaryMax.toLocaleString("de")} €/Jahr
Tech-Stack (gewünscht): ${prefs.techStack.join(", ") || "Allgemein IT"}
Level: ${prefs.jobLevel}
Job-Typen: ${prefs.jobTypes.join(", ") || "Alle IT-Bereiche"}
Länder: ${prefs.countries.join(", ") || "Deutschland, Österreich, Schweiz"}

=== AUFGABE ===
1. Analysiere das Profil und erkenne Stärken/Skills
2. Generiere EXAKT 10 realistische Stellenangebote die perfekt passen
3. Nutze echte Firmennamen aus dem DACH-Raum (SAP, BMW, Siemens, Bosch, Allianz, Deutsche Telekom, Zalando, Wirecard, TeamViewer, Celonis, CHECK24, N26, etc.)
4. Berechne einen genauen Match-Score (0-100) basierend auf Profil + Präferenzen
5. Unterscheide klar zwischen matchedSkills (vorhanden) und missingSkills (fehlen noch)

WICHTIG: Antworte NUR als valides JSON in folgendem Format:
{
  "profileAnalysis": {
    "detectedSkills": ["Skill1", "Skill2"],
    "experienceLevel": "Senior (5-8 Jahre)",
    "strongAreas": ["Backend-Entwicklung", "Cloud-Architektur"],
    "suggestions": ["TypeScript-Kenntnisse vertiefen", "AWS-Zertifizierung anstreben"]
  },
  "jobs": [
    {
      "id": "job_1",
      "company": "SAP SE",
      "companySize": "100.000+ Mitarbeiter",
      "position": "Senior Backend Developer (Java/Spring)",
      "location": "Walldorf / München",
      "country": "Deutschland",
      "workType": "HYBRID",
      "salaryMin": 85000,
      "salaryMax": 110000,
      "currency": "EUR",
      "matchScore": 94,
      "matchReasons": ["Exakte Tech-Stack-Übereinstimmung", "Erfahrungslevel passt", "Gewünschter Standort"],
      "requiredSkills": ["Java", "Spring Boot", "Kubernetes", "REST APIs"],
      "matchedSkills": ["Java", "Spring Boot", "REST APIs"],
      "missingSkills": ["Kubernetes"],
      "jobType": "Backend",
      "postedDaysAgo": 2,
      "applicationDeadline": "2026-07-31",
      "companyDescription": "SAP ist Weltmarktführer für Unternehmenssoftware...",
      "jobDescription": "Als Senior Backend Developer gestaltest du...",
      "benefits": ["Flexible Arbeitszeiten", "30 Tage Urlaub", "Homeoffice", "Weiterbildungsbudget 5.000€/Jahr"],
      "applyUrl": "https://jobs.sap.com",
      "isHighPriority": true
    }
  ]
}`;
}

// ── Lokaler Fallback ──────────────────────────────────────────────────────────

function generateFallbackJobs(prefs: SearchPreferences): { jobs: JobMatch[]; profileAnalysis: ProfileAnalysis } {
  const detectedSkills = prefs.techStack.length > 0
    ? prefs.techStack
    : ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git"];

  const companies = [
    { name: "SAP SE", size: "100.000+ MA", loc: "Walldorf", country: "Deutschland", desc: "Weltmarktführer für Unternehmenssoftware mit globaler Präsenz." },
    { name: "BMW Group", size: "100.000+ MA", loc: "München", country: "Deutschland", desc: "Führender Automobilhersteller mit starker Digitalisierungsstrategie." },
    { name: "Siemens AG", size: "100.000+ MA", loc: "München", country: "Deutschland", desc: "Globales Technologieunternehmen in Industrie, Infrastruktur und Transport." },
    { name: "Deutsche Telekom", size: "50.000-100.000 MA", loc: "Bonn / Remote", country: "Deutschland", desc: "Größter europäischer Telekommunikationskonzern." },
    { name: "Zalando SE", size: "10.000-50.000 MA", loc: "Berlin (Remote)", country: "Deutschland", desc: "Europas führende Online-Modeplattform mit starker Tech-Kultur." },
    { name: "CHECK24 GmbH", size: "1.000-10.000 MA", loc: "München", country: "Deutschland", desc: "Deutschlands größtes Vergleichsportal — agil und wachstumsstark." },
    { name: "N26 GmbH", size: "1.000-5.000 MA", loc: "Berlin (Remote)", country: "Deutschland", desc: "Europas führende Digitalbank mit 8 Mio. Kunden in 25 Ländern." },
    { name: "Erste Group IT", size: "5.000-10.000 MA", loc: "Wien", country: "Österreich", desc: "IT-Arm der Erste Group Bank — größter Retailbanker Österreichs." },
    { name: "Dynatrace Austria", size: "1.000-5.000 MA", loc: "Linz / Remote", country: "Österreich", desc: "Weltmarktführer für KI-gestütztes Observability & Cloud-Monitoring." },
    { name: "UBS AG Tech", size: "100.000+ MA", loc: "Zürich", country: "Schweiz", desc: "Globale Investmentbank mit einem der größten FinTech-Teams Europas." },
    { name: "Celonis SE", size: "1.000-5.000 MA", loc: "München / Remote", country: "Deutschland", desc: "Weltmarktführer für Process Mining — Unicorn aus München." },
    { name: "TeamViewer", size: "1.000-5.000 MA", loc: "Göppingen / Remote", country: "Deutschland", desc: "Globale Plattform für Remote Connectivity mit 30 Mio. Nutzern." },
  ];

  const positions = [
    { title: "Senior Full-Stack Developer", type: "Full-Stack", skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"] },
    { title: "Backend Engineer (Node.js/TypeScript)", type: "Backend", skills: ["Node.js", "TypeScript", "REST APIs", "PostgreSQL", "Redis"] },
    { title: "Frontend Engineer (React/Next.js)", type: "Frontend", skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Storybook"] },
    { title: "DevOps Engineer (Kubernetes/AWS)", type: "DevOps", skills: ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD"] },
    { title: "Cloud Architect (Azure/GCP)", type: "Cloud", skills: ["Azure", "GCP", "Microservices", "Docker", "Terraform"] },
    { title: "Senior Software Engineer (Java/Spring)", type: "Backend", skills: ["Java", "Spring Boot", "Microservices", "Kafka", "Kubernetes"] },
    { title: "Mobile Developer (React Native)", type: "Mobile", skills: ["React Native", "TypeScript", "iOS", "Android", "Firebase"] },
    { title: "Data Engineer (Python/Spark)", type: "Data", skills: ["Python", "Apache Spark", "SQL", "Airflow", "dbt"] },
    { title: "ML Engineer (Python/TensorFlow)", type: "ML/AI", skills: ["Python", "TensorFlow", "PyTorch", "MLflow", "Docker"] },
    { title: "Platform Engineer (Internal Developer)", type: "Platform", skills: ["Kubernetes", "Helm", "Go", "Prometheus", "GitOps"] },
  ];

  const salaryRanges: Record<string, [number, number]> = {
    JUNIOR: [45000, 65000],
    MID: [65000, 85000],
    SENIOR: [85000, 115000],
    LEAD: [110000, 150000],
    ANY: [65000, 100000],
  };

  const [baseSalMin, baseSalMax] = salaryRanges[prefs.jobLevel] || salaryRanges.ANY;

  // Nur Firmen aus den ausgewählten Ländern
  const filteredCompanies = prefs.countries && prefs.countries.length > 0
    ? companies.filter((c) => prefs.countries.includes(c.country))
    : companies;
  const activeCompanies = filteredCompanies.length > 0 ? filteredCompanies : companies;

  const jobs: JobMatch[] = activeCompanies.slice(0, 10).map((company, i) => {
    const pos = positions[i % positions.length];
    const matched = pos.skills.filter((s) =>
      detectedSkills.some((d) => d.toLowerCase() === s.toLowerCase())
    );
    const missing = pos.skills.filter((s) =>
      !detectedSkills.some((d) => d.toLowerCase() === s.toLowerCase())
    );
    const matchScore = Math.min(99, Math.max(55, Math.round(60 + (matched.length / pos.skills.length) * 39)));
    const salOffset = (i % 3) * 5000;

    const workTypes: Array<"REMOTE" | "HYBRID" | "ONSITE"> = ["HYBRID", "REMOTE", "HYBRID", "REMOTE", "HYBRID", "ONSITE", "REMOTE", "HYBRID", "ONSITE", "REMOTE"];
    const effectiveWorkType = prefs.workType === "ANY" ? workTypes[i] : workTypes[i];

    return {
      id: `job_${i + 1}`,
      company: company.name,
      companySize: company.size,
      position: pos.title,
      location: company.loc,
      country: company.country,
      workType: effectiveWorkType,
      salaryMin: Math.max(prefs.salaryMin || baseSalMin, baseSalMin + salOffset),
      salaryMax: Math.min(prefs.salaryMax || baseSalMax + 20000, baseSalMax + salOffset + 15000),
      currency: company.country === "Schweiz" ? "CHF" : "EUR",
      matchScore,
      matchReasons: [
        ...(matched.length > 0 ? [`${matched.length} Skills direkt passend`] : []),
        matchScore > 85 ? "Sehr hohe Profil-Übereinstimmung" : "Gute Profil-Übereinstimmung",
        prefs.location ? "Bevorzugter Standort" : "Remote-Option verfügbar",
      ],
      requiredSkills: pos.skills,
      matchedSkills: matched.length > 0 ? matched : [pos.skills[0]],
      missingSkills: missing,
      jobType: pos.type,
      postedDaysAgo: Math.floor(Math.random() * 14) + 1,
      applicationDeadline: i % 3 === 0 ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0] : undefined,
      companyDescription: company.desc,
      jobDescription: `Als ${pos.title} bei ${company.name} arbeitest du in einem internationalen Hochleistungsteam an skalierbaren Systemen. Du gestaltest die technische Zukunft mit und hast Einfluss auf Architekturentscheidungen.`,
      benefits: [
        "Flexible Arbeitszeiten",
        "30 Tage Urlaub",
        effectiveWorkType !== "ONSITE" ? "100% Remote möglich" : "Modernes Büro",
        "Weiterbildungsbudget 3.000-5.000€/Jahr",
        "Betriebliche Altersvorsorge",
        i % 2 === 0 ? "Deutschlandticket" : "Firmenwagen / BVG-Ticket",
      ],
      applyUrl: `https://careers.${company.name.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")}.com`,
      isHighPriority: matchScore >= 85,
    };
  });

  return {
    jobs: jobs.sort((a, b) => b.matchScore - a.matchScore),
    profileAnalysis: {
      detectedSkills,
      experienceLevel: prefs.jobLevel === "ANY" ? "Mid-Level (3-5 Jahre)" : `${prefs.jobLevel} Level`,
      strongAreas: detectedSkills.slice(0, 3).length > 0
        ? [`${detectedSkills[0]} Entwicklung`, "Moderne Web-Technologien"]
        : ["Fullstack-Entwicklung", "Cloud-Technologien"],
      suggestions: [
        "Docker/Kubernetes-Kenntnisse würden die Match-Quote deutlich erhöhen",
        "Eine AWS- oder Azure-Zertifizierung öffnet viele Türen",
        "Portfolio auf GitHub aufbauen und verlinken",
      ],
      documentCount: 0,
      applicationCount: 0,
    },
  };
}

// ── Anthropic Claude ──────────────────────────────────────────────────────────

async function callClaude(
  systemPrompt: string
): Promise<{ jobs: JobMatch[]; profileAnalysis: ProfileAnalysis } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: "Analysiere das Profil und generiere 10 passende Stellenangebote als JSON.",
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "{}";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      jobs: (parsed.jobs ?? []).map((j: JobMatch & { id?: string }, idx: number) => ({
        ...j,
        id: j.id ?? `job_${idx + 1}`,
        postedDaysAgo: j.postedDaysAgo ?? Math.floor(Math.random() * 10) + 1,
      })),
      profileAnalysis: parsed.profileAnalysis ?? null,
    };
  } catch {
    return null;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();

    const rl = enforceRateLimit(request, "agents:job-search", { max: 10, windowMs: 3_600_000 });
    if (rl) return rl;

    const body = await request.json() as SearchPreferences;

    const db = scopedPrisma(user.id);

    // Benutzerprofil lesen (scopedPrisma übernimmt userId-Scoping)
    const [allApplications, allDocuments] = await Promise.all([
      db.application.findMany({
        select: { companyName: true, position: true, status: true, location: true },
        orderBy: { appliedAt: "desc" },
      }),
      db.document.findMany({
        select: { name: true, fileType: true },
      }),
    ]);

    const applications = allApplications.slice(0, 20);
    const documents = allDocuments.slice(0, 10);

    const applicationSummary = applications
      .map((a: { position: string; companyName: string; status: string }) => `${a.position} bei ${a.companyName} (${a.status})`)
      .join("; ");

    const documentList = documents
      .map((d: { name: string }) => d.name)
      .join(", ");

    const systemPrompt = buildSystemPrompt(
      user.name ?? user.email,
      applicationSummary,
      documentList,
      body
    );

    // KI oder Fallback
    const aiResult = await callClaude(systemPrompt);

    let result: { jobs: JobMatch[]; profileAnalysis: ProfileAnalysis };
    if (aiResult && aiResult.jobs.length > 0) {
      result = {
        jobs: aiResult.jobs,
        profileAnalysis: {
          ...aiResult.profileAnalysis,
          documentCount: documents.length,
          applicationCount: applications.length,
        },
      };
    } else {
      const fallback = generateFallbackJobs(body);
      result = {
        ...fallback,
        profileAnalysis: {
          ...fallback.profileAnalysis,
          documentCount: documents.length,
          applicationCount: applications.length,
        },
      };
    }

    return NextResponse.json(result);
  } catch (err) {
    return handleGuardError(err);
  }
}
