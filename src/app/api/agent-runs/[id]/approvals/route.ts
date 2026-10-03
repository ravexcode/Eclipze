import { NextResponse } from "next/server";

import { appendRunEvent } from "@/lib/agent-runs";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });

  const { id: runId } = await context.params;
  const body = await request.json().catch(() => null) as { approvalId?: unknown; approved?: unknown } | null;
  if (!body || typeof body.approvalId !== "string" || typeof body.approved !== "boolean") {
    return NextResponse.json({ message: "approvalId and approved are required." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const result = await prisma.$transaction(async transaction => {
    const run = await transaction.agentRun.findFirst({
      where: { id: runId, userId: user.id, status: "WAITING_FOR_APPROVAL", cancelRequestedAt: null },
      select: { id: true },
    });
    if (!run) return false;

    const approval = await transaction.agentRunApproval.findFirst({
      where: { id: body.approvalId as string, runId, userId: user.id, status: "PENDING" },
      select: { id: true, toolName: true },
    });
    if (!approval) return false;

    const updated = await transaction.agentRunApproval.updateMany({
      where: { id: approval.id, status: "PENDING" },
      data: { status: body.approved ? "APPROVED" : "DENIED", decidedAt: new Date() },
    });
    return updated.count === 1 ? approval : false;
  });

  if (!result) {
    return NextResponse.json({ message: "This action is no longer waiting for approval." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS });
  }

  await appendRunEvent(runId, {
    type: "SYSTEM",
    message: body.approved ? `Approved ${result.toolName}.` : `Denied ${result.toolName}.`,
    metadata: { approvalId: result.id, approved: body.approved },
  });

  return NextResponse.json({ approved: body.approved }, { headers: PRIVATE_NO_STORE_HEADERS });
}
