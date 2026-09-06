import { NextResponse } from "next/server";

import { getCurrentUser, serializeUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    user: serializeUser(user),
  });
}
