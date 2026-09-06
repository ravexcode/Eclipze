import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  createVerificationCode,
  isValidEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";
import { sendAuthCodeEmail } from "@/lib/auth-email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    email?: string;
    password?: string;
  } | null;

  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const purpose = user.emailVerifiedAt ? "LOGIN_2FA" : "EMAIL_VERIFICATION";
  const verification = await createVerificationCode({
    userId: user.id,
    purpose,
  });

  try {
    await sendAuthCodeEmail({
      to: user.email,
      code: verification.code,
      purpose,
    });
  } catch {
    return NextResponse.json({
      message: "Email delivery is not configured yet. Add RESEND_API_KEY and AUTH_EMAIL_FROM before signing in.",
    }, { status: 503 });
  }

  return NextResponse.json({
    message: purpose === "LOGIN_2FA"
      ? "We sent a 6-digit verification code to your email."
      : "Your account still needs email verification. We sent a 6-digit code to finish activating it.",
    nextStep: purpose === "LOGIN_2FA" ? "verify_2fa" : "verify_email",
    email: user.email,
  });
}
