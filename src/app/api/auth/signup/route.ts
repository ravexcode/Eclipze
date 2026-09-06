import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  createVerificationCode,
  hashPassword,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
} from "@/lib/auth";
import { sendAuthCodeEmail } from "@/lib/auth-email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    email?: string;
    username?: string;
    password?: string;
    password_confirm?: string;
  } | null;

  const email = normalizeEmail(body?.email ?? "");
  const username = normalizeUsername(body?.username ?? "");
  const password = body?.password ?? "";
  const passwordConfirm = body?.password_confirm ?? "";

  if (!email || !username || !password || !passwordConfirm) {
    return NextResponse.json({ message: "Email, username, password, and password confirmation are required." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  }

  if (!isValidUsername(username)) {
    return NextResponse.json({ message: "Username must be 3-24 characters and use only letters, numbers, underscores, or hyphens." }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json({ message: "Password must be at least 8 characters long." }, { status: 400 });
  }

  if (password !== passwordConfirm) {
    return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
  }

  const [existingByEmail, existingByUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);

  if (existingByEmail) {
    return NextResponse.json({ message: "An account with that email already exists." }, { status: 409 });
  }

  if (existingByUsername) {
    return NextResponse.json({ message: "That username is already taken." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
    },
  });

  const verification = await createVerificationCode({
    userId: user.id,
    purpose: "EMAIL_VERIFICATION",
  });

  try {
    await sendAuthCodeEmail({
      to: email,
      code: verification.code,
      purpose: "EMAIL_VERIFICATION",
    });

    return NextResponse.json({
      message: "Account created. We sent a verification code to your email.",
      nextStep: "verify_email",
      email,
    }, { status: 201 });
  } catch {
    return NextResponse.json({
      message: "Account created, but email delivery is not configured yet. Add RESEND_API_KEY and AUTH_EMAIL_FROM, then resend the verification code.",
      nextStep: "verify_email",
      email,
      warning: true,
    }, { status: 202 });
  }
}
