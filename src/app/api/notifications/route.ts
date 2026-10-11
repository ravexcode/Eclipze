import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAuthorizedNotificationWhere, getNotificationReadWhere } from "@/lib/notifications";

const privateNoStoreHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: privateNoStoreHeaders });
  }

  const authorizedWhere = getAuthorizedNotificationWhere(user.id);
  const unreadWhere = getNotificationReadWhere(user.id);
  const countOnly = new URL(request.url).searchParams.get("countOnly") === "true";

  if (countOnly) {
    const unread = await prisma.notification.count({ where: unreadWhere });
    return NextResponse.json({ unread }, { headers: privateNoStoreHeaders });
  }

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: authorizedWhere,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { issue: { select: { id: true, title: true } } },
    }),
    prisma.notification.count({ where: unreadWhere }),
  ]);

  return NextResponse.json({ notifications, unread }, { headers: privateNoStoreHeaders });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: privateNoStoreHeaders });
  }
  const body = await request.json().catch(() => null) as { id?: unknown; issueId?: unknown; all?: unknown } | null;
  const payload = body ?? {};
  const hasAll = Object.hasOwn(payload, "all");
  const hasId = Object.hasOwn(payload, "id");
  const hasIssueId = Object.hasOwn(payload, "issueId");

  if (hasAll && payload.all !== true) {
    return NextResponse.json({ message: "Invalid notification update request." }, { status: 400, headers: privateNoStoreHeaders });
  }

  if (hasId && (typeof payload.id !== "string" || !payload.id.trim())) {
    return NextResponse.json({ message: "Notification id is required." }, { status: 400, headers: privateNoStoreHeaders });
  }

  if (hasIssueId && (typeof payload.issueId !== "string" || !payload.issueId.trim())) {
    return NextResponse.json({ message: "Issue id is required." }, { status: 400, headers: privateNoStoreHeaders });
  }

  const operationCount = Number(hasAll) + Number(hasId) + Number(hasIssueId);
  if (operationCount !== 1) {
    return NextResponse.json({ message: "Provide exactly one notification update target." }, { status: 400, headers: privateNoStoreHeaders });
  }

  if (payload.all === true) {
    await prisma.notification.updateMany({ where: getNotificationReadWhere(user.id), data: { readAt: new Date() } });
    return NextResponse.json({ updated: true }, { headers: privateNoStoreHeaders });
  }

  if (typeof payload.issueId === "string") {
    await prisma.notification.updateMany({
      where: {
        ...getNotificationReadWhere(user.id),
        issueId: payload.issueId,
      },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ updated: true }, { headers: privateNoStoreHeaders });
  }

  const notification = await prisma.notification.updateMany({
    where: {
      ...getAuthorizedNotificationWhere(user.id),
      id: payload.id as string,
    },
    data: { readAt: new Date() },
  });

  if (!notification.count) {
    return NextResponse.json({ message: "Notification not found." }, { status: 404, headers: privateNoStoreHeaders });
  }

  return NextResponse.json({ updated: true }, { headers: privateNoStoreHeaders });
}
