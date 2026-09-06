import { NextResponse } from "next/server";

import { clearSession } from "@/lib/auth";

export async function POST() {
  await clearSession();

  return NextResponse.json({
    message: "Signed out successfully.",
  });
}

export async function GET() {
  await clearSession();

  return NextResponse.json({
    message: "Signed out successfully.",
  });
}
