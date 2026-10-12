import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import type { AgentRunEventType } from "@/types/agent-runner";

type RunEventInput = {
  type: AgentRunEventType;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

export async function appendRunEventTransaction(
  database: Pick<PrismaClient, "$transaction">,
  runId: string,
  event: RunEventInput,
) {
  // Lock the parent so independent writers allocate from the latest committed events.
  return database.$transaction(async transaction => {
    const runs = await transaction.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM agent_runs WHERE id = ${runId} FOR UPDATE
    `;

    if (runs.length === 0) {
      throw new Error(`Agent run ${runId} was not found.`);
    }

    const previous = await transaction.agentRunEvent.findFirst({
      where: { runId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });

    return transaction.agentRunEvent.create({
      data: {
        runId,
        sequence: (previous?.sequence ?? 0) + 1,
        type: event.type,
        message: event.message.slice(0, 8_000),
        metadata: event.metadata,
      },
    });
  }, { isolationLevel: "ReadCommitted" });
}
