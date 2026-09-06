import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  consumeVerificationCode,
  createSession,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    email?: string;
    code?: string;
  } | null;

  const email = normalizeEmail(body?.email ?? "");
  const code = (body?.code ?? "").trim();

  if (!email || !code) {
    return NextResponse.json({ message: "Email and verification code are required." }, { status: 400 });
  }

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: "Please enter a valid email and a 6-digit verification code." }, { status: 400 });
  }

  const user = await consumeVerificationCode({
    email,
    purpose: "EMAIL_VERIFICATION",
    code,
  });

  if (!user) {
    return NextResponse.json({ message: "Invalid or expired verification code." }, { status: 400 });
  }

  if (!user.emailVerifiedAt) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerifiedAt: new Date(),
      },
    });
  }

  await createSession(user.id);

  return NextResponse.json({
    message: "Email verified. You are now signed in.",
    redirectTo: "/dashboard",
  });
}
