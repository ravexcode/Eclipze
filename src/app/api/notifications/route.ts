import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { issue: { select: { id: true, title: true } } },
  });
  return NextResponse.json({ notifications, unread: notifications.filter(notification => !notification.readAt).length }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: unknown; all?: unknown } | null;

  if (body?.all === true) {
    await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
    return NextResponse.json({ updated: true });
  }

  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ message: "Notification id is required." }, { status: 400 });
  const notification = await prisma.notification.updateMany({ where: { id: body.id, userId: user.id }, data: { readAt: new Date() } });
  if (!notification.count) return NextResponse.json({ message: "Notification not found." }, { status: 404 });
  return NextResponse.json({ updated: true });
}
