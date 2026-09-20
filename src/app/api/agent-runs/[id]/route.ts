import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { serializeAgentRun } from "@/lib/agent-runs";
import prisma from "@/lib/prisma";
import { notFound } from "@/lib/workspace-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  void request;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const run = await prisma.agentRun.findFirst({
    where: { id, userId: user.id },
    include: { events: { orderBy: { sequence: "asc" }, take: 200 } },
  });

  if (!run) {
    return notFound("Run not found.");
  }

  return NextResponse.json({ run: serializeAgentRun(run) }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
