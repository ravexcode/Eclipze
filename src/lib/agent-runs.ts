import "server-only";

import { generateAgentResponse } from "@/lib/agent-completion";
import { releaseAiCreditReservation, settleAiCreditReservation } from "@/lib/ai-credits";
import { Prisma } from "@prisma/client";
import type { AgentRunEventType } from "@/types/agent-runner";
import prisma from "@/lib/prisma";
import {
  cancelCommandForRun,
  cleanupRunWorkspace,
  createRunWorkspace,
  getIsolatedWorkspaceDiff,
  materializePublicRepository,
  resolveAllowedCommand,
  runAllowedCommand,
  sanitizeRunnerOutput,
  type RunnerEvent,
} from "@/lib/agent-runner";
import { join } from "node:path";

type RunWithRelations = {
  id: string;
  agentSessionId: string | null;
  repositoryId: string;
  status: string;
  permissionMode: string;
  creditReservation: number;
  model: string;
  prompt: string | null;
  commandKey: string;
  instructionsDigest: string;
  skillSnapshot: unknown;
  workspaceKey: string;
  errorCode: string | null;
  resultSummary: string | null;
  changePatch: string | null;
  cancelRequestedAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  events?: Array<{
    id: string;
    runId: string;
    sequence: number;
    type: string;
    message: string;
    metadata: unknown;
    createdAt: Date;
  }>;
};

function iso(value: Date | null) {
  return value?.toISOString() ?? null;
}

function serializeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function serializeAgentRun(run: RunWithRelations) {
  const skillSnapshot = Array.isArray(run.skillSnapshot) ? run.skillSnapshot : [];

  return {
    id: run.id,
    agentSessionId: run.agentSessionId,
    repositoryId: run.repositoryId,
    status: run.status,
    permissionMode: run.permissionMode,
    creditReservation: run.creditReservation,
    model: run.model,
    prompt: run.prompt,
    commandKey: run.commandKey,
    instructionsDigest: run.instructionsDigest,
    skills: skillSnapshot,
    workspaceKey: run.workspaceKey,
    errorCode: run.errorCode,
    resultSummary: run.resultSummary,
    changePatch: run.changePatch,
    cancelRequestedAt: iso(run.cancelRequestedAt),
    startedAt: iso(run.startedAt),
    finishedAt: iso(run.finishedAt),
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    events: run.events?.map(event => ({
      id: event.id,
      runId: event.runId,
      sequence: event.sequence,
      type: event.type,
      message: event.message,
      metadata: serializeMetadata(event.metadata),
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export async function appendRunEvent(runId: string, event: RunnerEvent) {
  const previous = await prisma.agentRunEvent.findFirst({
    where: { runId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });

  return prisma.agentRunEvent.create({
    data: {
      runId,
      sequence: (previous?.sequence ?? 0) + 1,
      type: event.type as AgentRunEventType,
      message: event.message.slice(0, 8_000),
      metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) as Prisma.InputJsonValue : undefined,
    },
  });
}

export async function requestAgentToolApproval(input: {
  runId: string;
  userId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
}) {
  const approval = await prisma.agentRunApproval.create({
    data: {
      runId: input.runId,
      userId: input.userId,
      toolName: input.toolName,
      input: JSON.parse(JSON.stringify(input.toolInput)) as Prisma.InputJsonValue,
    },
  });

  await prisma.agentRun.update({
    where: { id: input.runId },
    data: { status: "WAITING_FOR_APPROVAL" },
  });
  await appendRunEvent(input.runId, {
    type: "APPROVAL",
    message: `Approval required: ${input.toolName}`,
    metadata: { approvalId: approval.id, toolName: input.toolName, input: input.toolInput },
  });

  const expiresAt = Date.now() + 10 * 60_000;
  while (Date.now() < expiresAt) {
    const currentApproval = await prisma.agentRunApproval.findUnique({
      where: { id: approval.id },
      select: {
        status: true,
        run: { select: { status: true, cancelRequestedAt: true } },
      },
    });
    const run = currentApproval?.run;

    if (currentApproval?.status === "APPROVED") {
      if (!run?.cancelRequestedAt && run?.status !== "CANCELLED") {
        await prisma.agentRun.update({ where: { id: input.runId }, data: { status: "RUNNING" } });
      }
      return "APPROVED" as const;
    }
    if (currentApproval?.status === "DENIED") {
      if (!run?.cancelRequestedAt && run?.status !== "CANCELLED") {
        await prisma.agentRun.update({ where: { id: input.runId }, data: { status: "RUNNING" } });
      }
      return "DENIED" as const;
    }
    if (!run || run.status === "CANCELLED" || run.cancelRequestedAt) return "CANCELLED" as const;

    await new Promise(resolve => setTimeout(resolve, 2_000));
  }

  await prisma.agentRunApproval.updateMany({
    where: { id: approval.id, status: "PENDING" },
    data: { status: "DENIED", decidedAt: new Date() },
  });
  await prisma.agentRun.update({ where: { id: input.runId }, data: { status: "RUNNING" } });
  return "DENIED" as const;
}

async function updateRunFailure(runId: string, errorCode: string, resultSummary: string, status: "FAILED" | "BLOCKED" = "FAILED") {
  await prisma.agentRun.update({
    where: { id: runId },
    data: {
      status,
      errorCode,
      resultSummary,
      finishedAt: new Date(),
    },
  });
}

async function executeAgentRun(runId: string, userId: string) {
  const run = await prisma.agentRun.findFirst({
    where: { id: runId, userId },
    include: { repository: true },
  });

  if (!run) {
    return;
  }

  const workspacePath = await createRunWorkspace(userId, run.id);
  const repositoryPath = join(workspacePath, "repo");
  let creditsSettled = false;
  let eventQueue = Promise.resolve();
  const persistEvent = (event: RunnerEvent) => {
    eventQueue = eventQueue.then(() => appendRunEvent(run.id, event)).then(() => undefined);
    return eventQueue;
  };

  try {
    const currentRun = await prisma.agentRun.findUnique({
      where: { id: run.id },
      select: { status: true, cancelRequestedAt: true },
    });

    if (!currentRun || currentRun.status === "CANCELLED" || currentRun.cancelRequestedAt) {
      return;
    }

    await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "RUNNING", startedAt: new Date() },
    });
    await persistEvent({ type: "SYSTEM", message: "Run started." });

    const cloneResult = await materializePublicRepository({
      repositoryUrl: run.repository.repositoryUrl,
      defaultBranch: run.repository.defaultBranch,
      destinationPath: repositoryPath,
      onEvent: persistEvent,
    });

    if (!cloneResult.ok) {
      await persistEvent({
        type: "ERROR",
        message: cloneResult.message,
        metadata: { code: cloneResult.code },
      });
      await updateRunFailure(run.id, cloneResult.code, cloneResult.message);
      await eventQueue;
      return;
    }

    await persistEvent({ type: "SYSTEM", message: "Repository ready." });

    const cancelled = await prisma.agentRun.findUnique({
      where: { id: run.id },
      select: { cancelRequestedAt: true, status: true },
    });

    if (!cancelled || cancelled.status === "CANCELLED" || cancelled.cancelRequestedAt) {
      await persistEvent({ type: "SYSTEM", message: "Run cancelled after clone." });
      await eventQueue;
      return;
    }

    if (!run.prompt) {
      await persistEvent({ type: "ERROR", message: "This task does not include a prompt." });
      await updateRunFailure(run.id, "PROMPT_MISSING", "This task does not include a prompt.");
      await eventQueue;
      return;
    }

    const completion = await generateAgentResponse({
      userId,
      runId: run.id,
      model: run.model,
      permissionMode: run.permissionMode as "ASK" | "PLAN" | "USER_APPROVE" | "AUTO_APPROVE",
      prompt: run.prompt,
      repositoryPath,
      skillSnapshot: run.skillSnapshot,
      onEvent: persistEvent,
      requestApproval: (toolName, toolInput) => requestAgentToolApproval({
        runId: run.id,
        userId,
        toolName,
        toolInput,
      }),
    });

    if (run.creditReservation > 0) {
      if (completion.costUsd === null) {
        throw new Error("OpenRouter did not return task cost. Reserved credits were released.");
      }
      const spentCredits = await settleAiCreditReservation({
        userId,
        runId: run.id,
        reservedCredits: run.creditReservation,
        costUsd: completion.costUsd,
      });
      creditsSettled = true;
      await persistEvent({
        type: "SYSTEM",
        message: `Usage: $${completion.costUsd.toFixed(6)} USD · ${spentCredits} credits.`,
        metadata: {
          costUsd: completion.costUsd,
          credits: spentCredits,
          inputTokens: completion.usage.inputTokens ?? 0,
          outputTokens: completion.usage.outputTokens ?? 0,
        },
      });
    }

    const completionRun = await prisma.agentRun.findUnique({
      where: { id: run.id },
      select: { status: true, cancelRequestedAt: true },
    });

    if (!completionRun || completionRun.status === "CANCELLED" || completionRun.cancelRequestedAt) {
      const changePatch = await getIsolatedWorkspaceDiff(repositoryPath);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: "CANCELLED",
          errorCode: "CANCELLED",
          resultSummary: null,
          changePatch: changePatch || null,
          finishedAt: new Date(),
        },
      });
      await persistEvent({ type: "SYSTEM", message: "Run cancelled." });
      await eventQueue;
      return;
    }

    for (let offset = 0; offset < completion.answer.length; offset += 7_500) {
      await persistEvent({
        type: "OUTPUT",
        message: sanitizeRunnerOutput(completion.answer.slice(offset, offset + 7_500)),
      });
    }

    const changePatch = await getIsolatedWorkspaceDiff(repositoryPath);
    const resultSummary = sanitizeRunnerOutput(completion.answer).slice(0, 500);
    await persistEvent({ type: "RESULT", message: "Task completed." });

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        errorCode: null,
        resultSummary,
        changePatch: changePatch || null,
        finishedAt: new Date(),
      },
    });
    await eventQueue;
  } catch (error) {
    const message = sanitizeRunnerOutput(error instanceof Error ? error.message : "Runner failed unexpectedly.");
    const cancellation = await prisma.agentRun.findUnique({
      where: { id: run.id },
      select: { status: true, cancelRequestedAt: true },
    }).catch(() => null);
    if (cancellation?.status === "CANCELLED" || cancellation?.cancelRequestedAt) {
      const changePatch = await getIsolatedWorkspaceDiff(repositoryPath);
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: "CANCELLED",
          errorCode: "CANCELLED",
          changePatch: changePatch || null,
          finishedAt: new Date(),
        },
      });
      await persistEvent({ type: "SYSTEM", message: "Run cancelled." });
      await eventQueue;
      return;
    }
    await persistEvent({ type: "ERROR", message: "Runner failed unexpectedly." });
    const changePatch = await getIsolatedWorkspaceDiff(repositoryPath);
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorCode: "RUNNER_ERROR",
        resultSummary: message.slice(0, 500),
        changePatch: changePatch || null,
        finishedAt: new Date(),
      },
    });
    await eventQueue;
  } finally {
    if (run.creditReservation > 0 && !creditsSettled) {
      await releaseAiCreditReservation({ userId, runId: run.id, reservedCredits: run.creditReservation }).catch(() => undefined);
    }
    await cleanupRunWorkspace(userId, run.id);
  }
}

export function startAgentRun(runId: string, userId: string) {
  void executeAgentRun(runId, userId).catch(async () => {
    await updateRunFailure(runId, "RUNNER_ERROR", "Runner could not start.").catch(() => undefined);
  });
}

export async function cancelAgentRun(runId: string, userId: string) {
  const run = await prisma.agentRun.findFirst({ where: { id: runId, userId } });

  if (!run) {
    return null;
  }

  if (run.status === "QUEUED") {
    const cancelled = await prisma.agentRun.update({
      where: { id: run.id },
      data: { status: "CANCELLED", cancelRequestedAt: new Date(), finishedAt: new Date(), errorCode: "CANCELLED" },
    });
    await appendRunEvent(run.id, { type: "SYSTEM", message: "Run cancelled before start." });
    return cancelled;
  }

  if (run.status === "RUNNING" || run.status === "WAITING_FOR_APPROVAL") {
    await prisma.agentRun.update({ where: { id: run.id }, data: { cancelRequestedAt: new Date() } });
    cancelCommandForRun(run.id);
    return prisma.agentRun.findUnique({ where: { id: run.id } });
  }

  return run;
}

export async function runCommandInMaterializedWorkspace(input: {
  runId: string;
  userId: string;
  workspacePath: string;
  commandKey: string;
}) {
  const command = resolveAllowedCommand(input.commandKey);

  if (!command) {
    throw new Error("COMMAND_NOT_ALLOWED");
  }

  return runAllowedCommand({
    runId: input.runId,
    workspacePath: input.workspacePath,
    command: command.key,
    onEvent: async event => {
      await appendRunEvent(input.runId, event);
    },
  });
}
