import "server-only";

import { EXTERNAL_AGENT_PROVIDERS, type ExternalAgentProvider } from "@/constants/agent-providers";
import prisma from "@/lib/prisma";
import type { AiProvider } from "@/types/ai";

export function isExternalAgentProvider(provider: AiProvider): provider is ExternalAgentProvider {
  return Object.hasOwn(EXTERNAL_AGENT_PROVIDERS, provider);
}

export async function activateProviderAgent(input: {
  userId: string;
  provider: ExternalAgentProvider;
  model: string | null;
}) {
  const config = EXTERNAL_AGENT_PROVIDERS[input.provider];
  const defaultModel = input.model || config.defaultModel;
  const existingAgent = await prisma.agent.findFirst({
    where: { userId: input.userId, provider: input.provider },
    select: { id: true },
  });

  if (existingAgent) {
    await prisma.agent.update({
      where: { id: existingAgent.id },
      data: { defaultModel, status: "ACTIVE" },
    });
    return;
  }

  await prisma.agent.create({
    data: {
      userId: input.userId,
      name: config.agentName,
      provider: input.provider,
      defaultModel,
    },
  });
}

export async function deactivateProviderAgent(userId: string, provider: ExternalAgentProvider) {
  await prisma.agent.updateMany({
    where: { userId, provider },
    data: { status: "INACTIVE" },
  });
}
