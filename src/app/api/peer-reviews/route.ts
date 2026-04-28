/**
 * Peer-Review-Netzwerk API
 * GET  /api/peer-reviews          → Reviews für mich + meine Reviews
 * POST /api/peer-reviews          → Neues Dokument zur Review einreichen
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/database";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const [receivedReviews, openRequests] = await Promise.all([
      prisma.peerReview.findMany({
        where: { targetId: user.id },
        select: {
          id: true, documentType: true, feedback: true, rating: true,
          isAnonymous: true, createdAt: true,
          author: { select: { name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.peerReview.findMany({
        where: { authorId: { not: user.id }, targetId: { not: user.id } },
        select: {
          id: true, documentType: true, createdAt: true,
          target: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const formatted = receivedReviews.map((r) => ({
      ...r,
      author: r.isAnonymous ? null : r.author,
    }));

    return NextResponse.json({ receivedReviews: formatted, openRequests });
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
    const { documentType, documentText, reviewId, feedback, rating, isAnonymous = true } = await req.json();

    // Fall 1: Dokument zur Review einreichen (targetId = eigene ID, authorId wird beim Review gesetzt)
    if (documentType && documentText && !reviewId) {
      const review = await prisma.peerReview.create({
        data: {
          authorId: user.id,
          targetId: user.id,
          documentType,
          documentText: documentText.slice(0, 5000),
          feedback: "PENDING",
          rating: 0,
          isAnonymous,
        },
      });
      return NextResponse.json({ review, type: "submitted" }, { status: 201 });
    }

    // Fall 2: Feedback auf das Dokument eines anderen geben
    if (reviewId && feedback && rating) {
      const target = await prisma.peerReview.findUnique({ where: { id: reviewId } });
      if (!target) return NextResponse.json({ error: "Review nicht gefunden" }, { status: 404 });
      if (target.authorId === user.id) return NextResponse.json({ error: "Kein eigenes Dokument bewerten" }, { status: 400 });

      const myFeedback = await prisma.peerReview.create({
        data: {
          authorId: user.id,
          targetId: target.authorId,
          documentType: target.documentType,
          documentText: target.documentText,
          feedback,
          rating: Math.min(5, Math.max(1, rating)),
          isAnonymous,
        },
      });
      return NextResponse.json({ feedback: myFeedback, type: "reviewed" }, { status: 201 });
    }

    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
