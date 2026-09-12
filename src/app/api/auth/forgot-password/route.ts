import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { createVerificationCode, isValidEmail, normalizeEmail } from "@/lib/auth";
import { sendAuthCodeEmail } from "@/lib/auth-email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  const message = "If an eligible account exists, we sent a password reset code to that email.";

  if (!isValidEmail(email)) {
    return NextResponse.json({ message }, { status: 200 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.passwordHash && user.emailVerifiedAt) {
    const verification = await createVerificationCode({ userId: user.id, purpose: "PASSWORD_RESET" });
    try {
      await sendAuthCodeEmail({ to: user.email, code: verification.code, purpose: "PASSWORD_RESET" });
    } catch {
      // Keep the response indistinguishable from an unknown account.
    }
  }

  return NextResponse.json({ message });
}
