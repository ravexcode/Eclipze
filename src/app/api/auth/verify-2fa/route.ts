import { NextResponse } from "next/server";

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
    purpose: "LOGIN_2FA",
    code,
  });

  if (!user) {
    return NextResponse.json({ message: "Invalid or expired verification code." }, { status: 400 });
  }

  await createSession(user.id);

  return NextResponse.json({
    message: "Sign-in confirmed.",
    redirectTo: "/dashboard",
  });
}
