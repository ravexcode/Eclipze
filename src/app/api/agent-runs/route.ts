import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { appendRunEvent, serializeAgentRun, startAgentRun } from "@/lib/agent-runs";
import { ensureAiCreditWallet, reserveAiCredits, usdToAiCredits } from "@/lib/ai-credits";
import { resolveAllowedCommand, createInstructionsDigest } from "@/lib/agent-runner";
import { getOpenRouterCredential, getOpenRouterModels } from "@/lib/openrouter";
import { getProviderApiKey } from "@/lib/ai-provider-credentials";
import { PROVIDER_LABELS } from "@/constants/agent-providers";
import type { AgentProvider } from "@/types/ai";
import prisma from "@/lib/prisma";
import { badRequest, notFound, parseBody, requiredString } from "@/lib/workspace-api";
import { DEFAULT_AGENT_PERMISSION_MODE } from "@/constants/agents";
import { AGENT_PERMISSION_MODES, type AgentPermissionMode } from "@/types/agent-runner";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

const PERMISSION_MODES = new Set<string>(AGENT_PERMISSION_MODES);

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const projectId = new URL(request.url).searchParams.get("projectId")?.trim();
  const runs = await prisma.agentRun.findMany({
    where: {
      userId: user.id,
      ...(projectId ? { repository: { projectId, userId: user.id } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(
    { runs: runs.map(serializeAgentRun) },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await parseBody(request);

  if (!body) {
    return badRequest("Invalid JSON body.");
  }

  const repositoryId = requiredString(body.repositoryId, "repositoryId");
  const prompt = requiredString(body.prompt, "prompt");
  const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
  const model = requiredString(agentId ? body.model ?? "agent" : body.model, "model");

  if (repositoryId.error) return repositoryId.error;
  if (prompt.error) return prompt.error;
  if (model.error) return model.error;
  if (body.permissionMode !== undefined && (
    typeof body.permissionMode !== "string" || !PERMISSION_MODES.has(body.permissionMode)
  )) {
    return badRequest("Choose an available permission mode.");
  }
  const permissionMode = (body.permissionMode ?? DEFAULT_AGENT_PERMISSION_MODE) as AgentPermissionMode;
  if (prompt.value.length > 8_000) return badRequest("prompt is too long.");
  if (model.value.length > 200) return badRequest("model is too long.");

  let sessionId: string | null = null;

  if (typeof body.sessionId === "string" && body.sessionId.trim()) {
    const session = await prisma.agentSession.findFirst({
      where: { id: body.sessionId.trim(), userId: user.id },
      select: { id: true },
    });

    if (!session) return notFound("Agent session not found.");
    sessionId = session.id;
  }

  let provider: AgentProvider = "OPENROUTER";
  let runModel = model.value.trim();
  let mcpConnectionId: string | null = null;

  if (agentId) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId: user.id },
      select: { provider: true, defaultModel: true, mcpConnectionId: true, status: true },
    });

    if (!agent) return notFound("Agent not found.");
    if (agent.status !== "ACTIVE") return badRequest("This agent is inactive.");

    provider = agent.provider as AgentProvider;
    runModel = agent.defaultModel;
    mcpConnectionId = agent.mcpConnectionId;
  }

  let openRouterCredential = null;
  try {
    if (provider === "OPENROUTER") {
      openRouterCredential = await getOpenRouterCredential(user.id);
    } else if (provider === "MCP") {
      const connection = mcpConnectionId
        ? await prisma.mcpConnection.findFirst({ where: { id: mcpConnectionId, userId: user.id }, select: { id: true } })
        : null;
      if (!connection) return badRequest("Reconnect this agent's MCP server in Settings before tagging it.");
    } else if (!await getProviderApiKey(user.id, provider)) {
      return badRequest(`Connect a ${PROVIDER_LABELS[provider]} provider in Settings before tagging this agent.`);
    }
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to read provider connection." }, { status: 503, headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (provider === "OPENROUTER" && !openRouterCredential) {
    return badRequest("Connect an OpenRouter provider in Settings before starting a task.");
  }

  const repository = await prisma.workspaceRepository.findFirst({
    where: { id: repositoryId.value, userId: user.id },
    select: { id: true },
  });

  if (!repository) {
    return notFound("Repository not found.");
  }

  const requestedSkillIds = Array.isArray(body.skillIds)
    ? [...new Set(body.skillIds.filter((id): id is string => typeof id === "string"))]
    : [];

  if (requestedSkillIds.length > 10) {
    return badRequest("Choose no more than 10 skills per task.");
  }

  const selectedSkills = requestedSkillIds.length > 0
    ? await prisma.userSkill.findMany({
        where: { userId: user.id, id: { in: requestedSkillIds } },
        select: { id: true, sourceId: true, source: true, slug: true, name: true, content: true, version: true },
      })
    : [];

  if (selectedSkills.length !== requestedSkillIds.length) {
    return badRequest("One or more selected skills are no longer available.");
  }

  const commandKey = typeof body.commandKey === "string" && body.commandKey.trim()
    ? body.commandKey.trim()
    : "git-status";
  const command = resolveAllowedCommand(commandKey);
  if (!command) return badRequest("Command is not allowed.");

  let creditReservation = 0;
  if (openRouterCredential?.isServiceKey) {
    let models;
    try {
      models = await getOpenRouterModels(openRouterCredential.apiKey);
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to load OpenRouter model pricing." }, { status: 503, headers: PRIVATE_NO_STORE_HEADERS });
    }

    const selectedModel = models.find(item => item.id === runModel);
    if (!selectedModel) return badRequest("Choose an available OpenRouter model.");

    const totalSkillCharacters = selectedSkills.reduce((total, skill) => total + skill.content.length, 0);
    const estimatedInputTokens = Math.ceil((prompt.value.length + totalSkillCharacters + 40_000) / 2);
    const estimatedUsd = (estimatedInputTokens * selectedModel.pricing.prompt) + (2_048 * selectedModel.pricing.completion);
    creditReservation = Math.max(1, Math.ceil(usdToAiCredits(estimatedUsd) * 1.25));

    const wallet = await ensureAiCreditWallet(user.id);
    const availableCredits = wallet.balance - wallet.reservedCredits;
    if (creditReservation > availableCredits) {
      return NextResponse.json({
        message: `This model needs up to ${creditReservation} credits reserved for a run. Your available balance is ${Math.max(0, availableCredits)} credits. Choose a lower-cost model or wait for your next monthly grant.`,
        availableCredits: Math.max(0, availableCredits),
        requiredCredits: creditReservation,
      }, { status: 402, headers: PRIVATE_NO_STORE_HEADERS });
    }
  }

  const promptSnapshot = JSON.stringify({ prompt: prompt.value, skills: selectedSkills });

  const run = await prisma.agentRun.create({
    data: {
      userId: user.id,
      agentSessionId: sessionId,
      repositoryId: repository.id,
      model: runModel,
      provider,
      mcpConnectionId,
      permissionMode,
      creditReservation,
      prompt: prompt.value,
      commandKey: command.key,
      instructionsDigest: createInstructionsDigest(promptSnapshot),
      skillSnapshot: selectedSkills.map(skill => ({
        id: skill.id,
        sourceId: skill.sourceId,
        source: skill.source,
        slug: skill.slug,
        name: skill.name,
        version: skill.version,
        content: skill.content,
      })),
      workspaceKey: randomUUID(),
    },
    include: { events: true },
  });

  if (creditReservation > 0) {
    const reserved = await reserveAiCredits({ userId: user.id, runId: run.id, credits: creditReservation });
    if (!reserved) {
      await prisma.agentRun.delete({ where: { id: run.id } });
      const wallet = await ensureAiCreditWallet(user.id);
      return NextResponse.json({
        message: "Your available AI credit balance changed before this task could start. Refresh the balance and try again.",
        availableCredits: Math.max(0, wallet.balance - wallet.reservedCredits),
      }, { status: 402, headers: PRIVATE_NO_STORE_HEADERS });
    }
  }

  await appendRunEvent(run.id, { type: "SYSTEM", message: "Run queued." });
  startAgentRun(run.id, user.id);

  const createdRun = await prisma.agentRun.findUnique({
    where: { id: run.id },
    include: { events: { orderBy: { sequence: "asc" } } },
  });

  return NextResponse.json(
    { run: createdRun ? serializeAgentRun(createdRun) : serializeAgentRun(run) },
    { status: 202, headers: PRIVATE_NO_STORE_HEADERS },
  );
}
