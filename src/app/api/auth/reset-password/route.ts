import { NextResponse } from "next/server";

import { hashPassword, isValidEmail, isValidPassword, normalizeEmail, resetPasswordWithCode } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: string; code?: string; password?: string; password_confirm?: string } | null;
  const email = normalizeEmail(body?.email ?? "");
  const code = (body?.code ?? "").trim();
  const password = body?.password ?? "";
  const confirm = body?.password_confirm ?? "";

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) return NextResponse.json({ message: "Please enter a valid email and a 6-digit code." }, { status: 400 });
  if (!isValidPassword(password)) return NextResponse.json({ message: "Password must be at least 8 characters long." }, { status: 400 });
  if (password !== confirm) return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const reset = await resetPasswordWithCode({ email, code, passwordHash });
  if (!reset) return NextResponse.json({ message: "Invalid or expired password reset code." }, { status: 400 });

  return NextResponse.json({ message: "Password reset successfully.", redirectTo: "/auth/signin" });
}
