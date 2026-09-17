import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (actor.role !== "DEVELOPER") return NextResponse.json({ message: "Developer access required." }, { status: 403 });

  const userId = (await context.params).id;
  const body = await request.json().catch(() => null) as { role?: unknown } | null;
  if (body?.role !== "USER" && body?.role !== "DEVELOPER") return NextResponse.json({ message: "A valid role is required." }, { status: 400 });
  if (userId === actor.id && body.role === "USER") return NextResponse.json({ message: "You cannot remove your own Developer access." }, { status: 400 });

  if (body.role === "USER" && await prisma.user.count({ where: { role: "DEVELOPER" } }) <= 1) {
    return NextResponse.json({ message: "At least one Developer account must remain." }, { status: 400 });
  }

  const updated = await prisma.user.updateMany({ where: { id: userId }, data: { role: body.role } });
  if (!updated.count) return NextResponse.json({ message: "User not found." }, { status: 404 });
  return NextResponse.json({ updated: true });
}
