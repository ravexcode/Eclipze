import { NextResponse } from "next/server";

import { encryptApiKey } from "@/lib/ai-credentials";
import { getCurrentUser } from "@/lib/auth";
import { verifyMcpTool } from "@/lib/mcp-client";
import { assertPublicHttpsUrl } from "@/lib/mcp-url";
import prisma from "@/lib/prisma";
import { badRequest, parseBody } from "@/lib/workspace-api";
import { DEFAULT_MCP_TOOL_NAME } from "@/constants/mcp";
import { getAgentHandle } from "@/utils/agents/mentions";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

const HANDLE_PATTERN = /^[\w-]+$/;

function serializeMcpConnection(connection: {
  id: string;
  name: string;
  url: string;
  toolName: string;
  encryptedToken: string | null;
  createdAt: Date;
}) {
  return {
    id: connection.id,
    name: connection.name,
    url: connection.url,
    toolName: connection.toolName,
    hasToken: Boolean(connection.encryptedToken),
    createdAt: connection.createdAt.toISOString(),
  };
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const connections = await prisma.mcpConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    { connections: connections.map(serializeMcpConnection) },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const toolName = typeof body.toolName === "string" && body.toolName.trim()
    ? body.toolName.trim()
    : DEFAULT_MCP_TOOL_NAME;
  const handle = getAgentHandle(name);

  if (!name || name.length > 40 || !HANDLE_PATTERN.test(handle)) {
    return badRequest("Use a name up to 40 characters with letters, numbers, spaces, dashes or underscores.");
  }
  if (!rawUrl || rawUrl.length > 500) return badRequest("A valid MCP server URL is required.");
  if (token.length > 500) return badRequest("Token is too long.");
  if (toolName.length > 100) return badRequest("Tool name is too long.");

  const existingAgents = await prisma.agent.findMany({
    where: { userId: user.id },
    select: { name: true },
  });
  if (existingAgents.some(agent => getAgentHandle(agent.name).toLowerCase() === handle.toLowerCase())) {
    return badRequest(`You already have an agent tagged @${handle}. Choose another name.`);
  }

  let encryptedToken: string | null = null;
  try {
    await assertPublicHttpsUrl(rawUrl);
    encryptedToken = token ? encryptApiKey(token) : null;
    await verifyMcpTool({ url: rawUrl, encryptedToken }, toolName);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Unable to connect to the MCP server.");
  }

  const connection = await prisma.$transaction(async transaction => {
    const created = await transaction.mcpConnection.create({
      data: { userId: user.id, name, url: rawUrl, encryptedToken, toolName },
    });
    await transaction.agent.create({
      data: {
        userId: user.id,
        name,
        provider: "MCP",
        defaultModel: toolName,
        mcpConnectionId: created.id,
      },
    });
    return created;
  });

  return NextResponse.json(
    { message: `${name} connected successfully.`, connection: serializeMcpConnection(connection) },
    { status: 201, headers: PRIVATE_NO_STORE_HEADERS },
  );
}
