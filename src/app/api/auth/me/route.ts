import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch {
    // Nicht eingeloggt → 200 mit user: null (kein Browser-Konsolenfehler)
    return NextResponse.json({ user: null });
  }
}
