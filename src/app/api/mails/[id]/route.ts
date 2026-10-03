import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { notFound, parseBody } from "@/lib/workspace-api";
import prisma from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const PRIVATE_NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await parseBody(request);
  if (!body || body.read !== true) return NextResponse.json({ message: "read must be true." }, { status: 400 });

  const { id } = await context.params;
  const updated = await prisma.mail.updateMany({
    where: { id, recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  if (!updated.count) {
    const existing = await prisma.mail.findFirst({ where: { id, recipientId: user.id }, select: { id: true } });
    if (!existing) return notFound("Mail not found.");
  }

  return NextResponse.json({ updated: true }, { headers: PRIVATE_NO_STORE_HEADERS });
}
