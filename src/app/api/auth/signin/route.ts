import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import {
  createSession,
  describeDevice,
  getRequestIp,
  isValidEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth";
import { sendNewSignInEmail } from "@/lib/auth-email";

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

  if (!user.emailVerifiedAt) {
    return NextResponse.json({
      message: "Please verify your email before signing in.",
      actionHref: "/auth/verify-email",
      actionLabel: "Verify email",
    }, { status: 403 });
  }

  await createSession(user.id);
  void sendNewSignInEmail({
    to: user.email,
    ip: getRequestIp(request),
    device: describeDevice(request.headers.get("user-agent")),
    occurredAt: new Date().toISOString(),
  }).catch(() => undefined);

  return NextResponse.json({
    message: "Signed in successfully.",
    redirectTo: "/dashboard",
  });
}
