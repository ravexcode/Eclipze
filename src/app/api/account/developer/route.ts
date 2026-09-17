import { NextResponse } from "next/server";

import { getCurrentUser, serializeUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const updatedUser = user.role === "DEVELOPER"
    ? user
    : await prisma.user.update({ where: { id: user.id }, data: { role: "DEVELOPER" } });

  return NextResponse.json({ user: serializeUser(updatedUser) }, { headers: { "Cache-Control": "private, no-store" } });
}
