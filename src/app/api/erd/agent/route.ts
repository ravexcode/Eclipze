import { randomUUID } from "node:crypto";

import { PROVIDER_LABELS } from "@/constants/agent-providers";
import {
  ERD_AGENT_ESTIMATED_OUTPUT_TOKENS,
  ERD_AGENT_MAX_MESSAGE_LENGTH,
  ERD_AGENT_MAX_MESSAGES,
  ERD_AGENT_MAX_TOOL_CYCLES,
  ERD_AGENT_PROMPT_OVERHEAD_CHARACTERS,
  ERD_AGENT_UNSUPPORTED_PROVIDERS,
} from "@/constants/erd";
import { getProviderApiKey } from "@/lib/ai-provider-credentials";
import {
  ensureAiCreditWallet,
  findExhaustedUsageWindow,
  getAiCreditUsageWindows,
  releaseAiCreditReservation,
  reserveAiCredits,
  settleAiCreditReservation,
  usdToAiCredits,
} from "@/lib/ai-credits";
import { getCurrentUser } from "@/lib/auth";
import { findDatabaseConnection, readDatabaseCredential } from "@/lib/database-connections";
import { erdAccessError, erdJson, parseErdDocument } from "@/lib/erd";
import { runErdAgent, type ErdAgentDatabase } from "@/lib/erd-agent";
import { getOpenRouterCredential, getOpenRouterModels } from "@/lib/openrouter";
import prisma from "@/lib/prisma";
import { ownedProject, parseBody } from "@/lib/workspace-api";
import type { AiProvider } from "@/types/ai";
import { formatTimeUntil } from "@/utils/usage-limits";

type AgentMessage = { role: "user" | "assistant"; content: string };

function readMessages(value: unknown): AgentMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > ERD_AGENT_MAX_MESSAGES) {
    return null;
  }

  const messages: AgentMessage[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;

    const { role, content } = item as Record<string, unknown>;

    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    if (!content.trim() || content.length > ERD_AGENT_MAX_MESSAGE_LENGTH) return null;

    messages.push({ role, content });
  }

  return messages.at(-1)?.role === "user" ? messages : null;
}

async function readAgentCredential(userId: string, provider: AiProvider) {
  if (provider === "OPENROUTER") return getOpenRouterCredential(userId);

  const apiKey = await getProviderApiKey(userId, provider);

  return apiKey ? { apiKey, isServiceKey: false } : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return erdJson({ message: "Unauthorized" }, 401);
  }

  const accessError = erdAccessError(user);

  if (accessError) {
    return accessError;
  }

  const body = await parseBody(request);

  if (!body) {
    return erdJson({ message: "Invalid JSON body." }, 400);
  }

  const project = await ownedProject(user.id, typeof body.projectId === "string" ? body.projectId : null);

  if (!project) {
    return erdJson({ message: "Project not found." }, 404);
  }

  const messages = readMessages(body.messages);

  if (!messages) {
    return erdJson({ message: `Send up to ${ERD_AGENT_MAX_MESSAGES} messages of up to ${ERD_AGENT_MAX_MESSAGE_LENGTH} characters, ending with your message.` }, 400);
  }

  const document = parseErdDocument(body.document);

  if (document.error !== undefined) {
    return erdJson({ message: document.error }, 400);
  }

  const agent = typeof body.agentId === "string"
    ? await prisma.agent.findFirst({
        where: { id: body.agentId, userId: user.id },
        select: { provider: true, defaultModel: true, status: true },
      })
    : null;

  if (!agent) {
    return erdJson({ message: "Choose one of your agents." }, 404);
  }

  if (agent.status !== "ACTIVE") {
    return erdJson({ message: "This agent is inactive." }, 400);
  }

  if (ERD_AGENT_UNSUPPORTED_PROVIDERS.has(agent.provider)) {
    return erdJson({ message: "This agent's provider cannot use ERD tools. Choose an agent that uses an API key provider." }, 400);
  }

  const provider = agent.provider as AiProvider;
  let credential;

  try {
    credential = await readAgentCredential(user.id, provider);
  } catch (error) {
    return erdJson({ message: error instanceof Error ? error.message : "Unable to read the provider connection." }, 503);
  }

  if (!credential) {
    return erdJson({ message: `Connect a ${PROVIDER_LABELS[provider]} provider in Settings before chatting with this agent.` }, 400);
  }

  let database: ErdAgentDatabase | null = null;
  const databaseTarget = typeof body.database === "object" && body.database !== null
    ? body.database as Record<string, unknown>
    : null;

  if (databaseTarget) {
    const connection = typeof databaseTarget.connectionId === "string"
      ? await findDatabaseConnection(user.id, databaseTarget.connectionId)
      : null;

    if (!connection || typeof databaseTarget.projectId !== "string" || !databaseTarget.projectId.trim()) {
      return erdJson({ message: "Choose a connected database project." }, 400);
    }

    try {
      database = {
        credential: readDatabaseCredential(connection),
        projectId: databaseTarget.projectId.trim(),
      };
    } catch (error) {
      return erdJson({ message: error instanceof Error ? error.message : "Unable to read the database connection." }, 503);
    }
  }

  // Platform-funded OpenRouter usage is charged in AI credits, reserved up front like agent runs.
  const reservationId = `erd-agent:${randomUUID()}`;
  let creditReservation = 0;

  if (credential.isServiceKey) {
    let models;

    try {
      models = await getOpenRouterModels(credential.apiKey);
    } catch (error) {
      return erdJson({ message: error instanceof Error ? error.message : "Unable to load OpenRouter model pricing." }, 503);
    }

    const selectedModel = models.find(item => item.id === agent.defaultModel);

    if (!selectedModel) {
      return erdJson({ message: "This agent's model is no longer available on OpenRouter." }, 400);
    }

    const promptCharacters = messages.reduce((total, message) => total + message.content.length, 0)
      + JSON.stringify(document.value).length
      + ERD_AGENT_PROMPT_OVERHEAD_CHARACTERS;
    const estimatedInputTokens = Math.ceil(promptCharacters / 2) * Math.ceil(ERD_AGENT_MAX_TOOL_CYCLES / 2);
    const estimatedUsd = (estimatedInputTokens * selectedModel.pricing.prompt)
      + (ERD_AGENT_ESTIMATED_OUTPUT_TOKENS * selectedModel.pricing.completion);
    creditReservation = Math.max(1, Math.ceil(usdToAiCredits(estimatedUsd) * 1.25));

    const wallet = await ensureAiCreditWallet(user.id);
    const usageWindows = await getAiCreditUsageWindows({
      userId: user.id,
      reservedCredits: wallet.reservedCredits,
    });
    const exhaustedWindow = findExhaustedUsageWindow(usageWindows);

    if (exhaustedWindow) {
      const resetMessage = exhaustedWindow.resetAt
        ? ` It resets in ${formatTimeUntil(exhaustedWindow.resetAt)}.`
        : "";

      return erdJson({
        message: `You reached your ${exhaustedWindow.label} usage limit of ${exhaustedWindow.limitCredits} credits.${resetMessage}`,
      }, 429);
    }

    const reserved = await reserveAiCredits({ userId: user.id, runId: reservationId, credits: creditReservation });

    if (!reserved) {
      return erdJson({
        message: `This model needs up to ${creditReservation} credits reserved per message. Choose a lower-cost agent or wait for your next monthly grant.`,
      }, 402);
    }
  }

  let creditsSettled = false;

  try {
    const result = await runErdAgent({
      provider,
      apiKey: credential.apiKey,
      model: agent.defaultModel,
      userId: user.id,
      messages,
      document: document.value,
      database,
    });
    let credits: number | null = null;

    if (creditReservation > 0 && result.costUsd !== null) {
      credits = await settleAiCreditReservation({
        userId: user.id,
        runId: reservationId,
        reservedCredits: creditReservation,
        costUsd: result.costUsd,
      });
      creditsSettled = true;
    }

    return erdJson({
      answer: result.answer,
      document: result.document,
      changes: result.changes,
      credits,
    });
  } catch (error) {
    return erdJson({ message: error instanceof Error ? error.message : "The agent could not respond." }, 502);
  } finally {
    if (creditReservation > 0 && !creditsSettled) {
      await releaseAiCreditReservation({ userId: user.id, runId: reservationId, reservedCredits: creditReservation }).catch(() => undefined);
    }
  }
}
