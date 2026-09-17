import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function developer() {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  if (user.role !== "DEVELOPER") return { response: NextResponse.json({ message: "Developer access required." }, { status: 403 }) };
  return { user };
}

export async function GET(request: Request) {
  const access = await developer();
  if (access.response) return access.response;
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const users = await prisma.user.findMany({
    where: query ? { OR: [{ email: { contains: query, mode: "insensitive" } }, { username: { contains: query, mode: "insensitive" } }] } : {},
    select: { id: true, email: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ users });
}

export async function PATCH(request: Request) {
  const access = await developer();
  if (access.response) return access.response;
  const body = await request.json().catch(() => null) as { userId?: unknown; role?: unknown } | null;
  if (typeof body?.userId !== "string" || (body.role !== "USER" && body.role !== "DEVELOPER")) {
    return NextResponse.json({ message: "userId and a valid role are required." }, { status: 400 });
  }
  if (body.userId === access.user?.id && body.role === "USER") return NextResponse.json({ message: "You cannot remove your own Developer access." }, { status: 400 });
  if (body.role === "USER") {
    const developers = await prisma.user.count({ where: { role: "DEVELOPER" } });
    if (developers <= 1) return NextResponse.json({ message: "At least one Developer account must remain." }, { status: 400 });
  }
  const updated = await prisma.user.updateMany({ where: { id: body.userId }, data: { role: body.role } });
  if (!updated.count) return NextResponse.json({ message: "User not found." }, { status: 404 });
  return NextResponse.json({ updated: true });
}
