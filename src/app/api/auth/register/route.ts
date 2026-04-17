import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database";
import { signToken, COOKIE_NAME, MAX_AGE } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, E-Mail und Passwort sind erforderlich." }, { status: 400 });
    }

    // E-Mail-Format und Länge validieren
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
    }
    if (name.trim().length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Name muss 2–100 Zeichen lang sein." }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Passwort zu lang (max. 128 Zeichen)." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Das Passwort muss mindestens 8 Zeichen lang sein." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "Diese E-Mail-Adresse ist bereits registriert." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: hashedPassword,
        emailVerified: false,
        role: "USER",
        status: "ACTIVE",
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = await signToken({ sub: user.id, email: user.email, name: user.name ?? "", role: user.role });

    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registrierung fehlgeschlagen." }, { status: 500 });
  }
}
