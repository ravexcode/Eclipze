import { NextResponse } from "next/server";

import { cancelAgentRun, serializeAgentRun } from "@/lib/agent-runs";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "@/lib/workspace-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  void request;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const run = await cancelAgentRun(id, user.id);

  if (!run) {
    return notFound("Run not found.");
  }

  return NextResponse.json({ run: serializeAgentRun(run) });
}
