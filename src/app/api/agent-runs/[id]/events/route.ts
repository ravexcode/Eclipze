import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "@/lib/workspace-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const run = await prisma.agentRun.findFirst({ where: { id, userId: user.id }, select: { id: true } });

  if (!run) {
    return notFound("Run not found.");
  }

  const url = new URL(request.url);
  const afterValue = Number(url.searchParams.get("after") ?? "0");
  const after = Number.isInteger(afterValue) && afterValue >= 0 ? afterValue : 0;
  const events = await prisma.agentRunEvent.findMany({
    where: { runId: run.id, sequence: { gt: after } },
    orderBy: { sequence: "asc" },
    take: 100,
  });

  return NextResponse.json({ events: events.map(event => ({
    id: event.id,
    runId: event.runId,
    sequence: event.sequence,
    type: event.type,
    message: event.message,
    metadata: event.metadata,
    createdAt: event.createdAt.toISOString(),
  })) }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
