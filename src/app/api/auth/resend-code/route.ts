import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  createVerificationCode,
  isValidEmail,
  normalizeEmail,
  type AuthCodePurpose,
} from "@/lib/auth";
import { sendAuthCodeEmail } from "@/lib/auth-email";

function isSupportedPurpose(value: string): value is AuthCodePurpose {
  return value === "EMAIL_VERIFICATION";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    email?: string;
    purpose?: string;
  } | null;

  const email = normalizeEmail(body?.email ?? "");
  const purpose = body?.purpose ?? "";

  if (!email || !purpose) {
    return NextResponse.json({ message: "Email and purpose are required." }, { status: 400 });
  }

  if (!isValidEmail(email) || !isSupportedPurpose(purpose)) {
    return NextResponse.json({ message: "Invalid resend request." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return NextResponse.json({ message: "No account was found for that email." }, { status: 404 });
  }

  if (purpose === "EMAIL_VERIFICATION" && user.emailVerifiedAt) {
    return NextResponse.json({ message: "This email is already verified." }, { status: 400 });
  }

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
      message: "Email delivery is not configured yet. Add RESEND_API_KEY and AUTH_EMAIL_FROM before resending codes.",
    }, { status: 503 });
  }

  return NextResponse.json({
    message: "A new verification code was sent.",
  });
}
