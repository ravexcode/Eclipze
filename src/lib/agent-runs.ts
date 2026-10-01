import "server-only";

import { generateAgentResponse } from "@/lib/agent-completion";
import type { AgentRunEventType } from "@/types/agent-runner";
import prisma from "@/lib/prisma";
import {
  cancelCommandForRun,
  cleanupRunWorkspace,
  createRunWorkspace,
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
  model: string;
  prompt: string | null;
  commandKey: string;
  instructionsDigest: string;
  skillSnapshot: unknown;
  workspaceKey: string;
  errorCode: string | null;
  resultSummary: string | null;
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
    model: run.model,
    prompt: run.prompt,
    commandKey: run.commandKey,
    instructionsDigest: run.instructionsDigest,
    skills: skillSnapshot,
    workspaceKey: run.workspaceKey,
    errorCode: run.errorCode,
    resultSummary: run.resultSummary,
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
      metadata: event.metadata ?? undefined,
    },
  });
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

    const repositoryPath = join(workspacePath, "repo");
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

    const answer = await generateAgentResponse({
      userId,
      model: run.model,
      prompt: run.prompt,
      repositoryPath,
      skillSnapshot: run.skillSnapshot,
    });

    const completionRun = await prisma.agentRun.findUnique({
      where: { id: run.id },
      select: { status: true, cancelRequestedAt: true },
    });

    if (!completionRun || completionRun.status === "CANCELLED" || completionRun.cancelRequestedAt) {
      await prisma.agentRun.update({
        where: { id: run.id },
        data: {
          status: "CANCELLED",
          errorCode: "CANCELLED",
          resultSummary: null,
          finishedAt: new Date(),
        },
      });
      await persistEvent({ type: "SYSTEM", message: "Run cancelled." });
      await eventQueue;
      return;
    }

    for (let offset = 0; offset < answer.length; offset += 7_500) {
      await persistEvent({
        type: "OUTPUT",
        message: sanitizeRunnerOutput(answer.slice(offset, offset + 7_500)),
      });
    }

    const resultSummary = sanitizeRunnerOutput(answer).slice(0, 500);
    await persistEvent({ type: "RESULT", message: "Task completed." });

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        errorCode: null,
        resultSummary,
        finishedAt: new Date(),
      },
    });
    await eventQueue;
  } catch (error) {
    const message = sanitizeRunnerOutput(error instanceof Error ? error.message : "Runner failed unexpectedly.");
    await persistEvent({ type: "ERROR", message: "Runner failed unexpectedly." });
    await updateRunFailure(run.id, "RUNNER_ERROR", message.slice(0, 500));
    await eventQueue;
  } finally {
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

  if (run.status === "RUNNING") {
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
