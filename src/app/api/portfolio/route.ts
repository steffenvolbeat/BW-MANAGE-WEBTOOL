/**
 * Portfolio-Generator API
 * GET  /api/portfolio/[slug]  → Öffentliches Portfolio anzeigen
 * GET  /api/portfolio         → Eigenes Portfolio holen
 * POST /api/portfolio         → Portfolio erstellen/aktualisieren
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const profile = await prisma.portfolioProfile.findUnique({
      where: { userId: user.id },
    });

    // Benutzerdaten für Pre-Fill holen
    const [applications, documents, contacts] = await Promise.all([
      prisma.application.findMany({ where: { userId: user.id }, select: { companyName: true, position: true, status: true, appliedAt: true } }),
      prisma.document.findMany({ where: { userId: user.id }, select: { name: true, type: true, uploadedAt: true } }),
      prisma.contact.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ profile, userData: { applications, documents, contactCount: contacts } });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user.role === "MANAGER" || user.role === "VERMITTLER") {
      return NextResponse.json({ error: "Keine Schreibrechte" }, { status: 403 });
    }
    const { headline, bio, skills, githubUrl, linkedinUrl, websiteUrl, theme, isPublic, slug } = await req.json();

    if (!headline || !bio) {
      return NextResponse.json({ error: "Headline und Bio erforderlich" }, { status: 400 });
    }

    const portfolioSlug = slug ?? user.id.slice(-8);

    // Slug-Konflikt prüfen
    if (slug) {
      const conflicting = await prisma.portfolioProfile.findFirst({
        where: { slug, userId: { not: user.id } },
      });
      if (conflicting) {
        return NextResponse.json({ error: "Dieser Slug ist bereits vergeben" }, { status: 409 });
      }
    }

    const profile = await prisma.portfolioProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        slug: portfolioSlug,
        headline,
        bio,
        skills: skills ?? [],
        githubUrl: githubUrl ?? null,
        linkedinUrl: linkedinUrl ?? null,
        websiteUrl: websiteUrl ?? null,
        theme: theme ?? "modern",
        isPublic: isPublic ?? false,
      },
      update: {
        headline,
        bio,
        skills: skills ?? [],
        githubUrl: githubUrl ?? null,
        linkedinUrl: linkedinUrl ?? null,
        websiteUrl: websiteUrl ?? null,
        theme: theme ?? "modern",
        isPublic: isPublic ?? false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
