import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { decryptApiKey } from "@/lib/ai-credentials";
import { assertPublicHttpsUrl } from "@/lib/mcp-url";
import {
  MCP_CALL_TIMEOUT_MS,
  MCP_CANCEL_POLL_INTERVAL_MS,
  MCP_CLIENT_INFO,
  MCP_CONNECT_TIMEOUT_MS,
} from "@/constants/mcp";

type McpConnectionTarget = {
  url: string;
  encryptedToken: string | null;
};

async function fetchPublicUrl(input: string | URL, init?: RequestInit) {
  await assertPublicHttpsUrl(String(input));
  return fetch(input, { ...init, redirect: "error" });
}

async function withMcpClient<T>(
  connection: McpConnectionTarget,
  run: (client: Client) => Promise<T>,
) {
  const url = await assertPublicHttpsUrl(connection.url);
  const token = connection.encryptedToken ? decryptApiKey(connection.encryptedToken) : null;
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    fetch: fetchPublicUrl,
  });
  const client = new Client(MCP_CLIENT_INFO);

  try {
    await client.connect(transport, { timeout: MCP_CONNECT_TIMEOUT_MS });
    return await run(client);
  } finally {
    await client.close().catch(() => undefined);
  }
}

export async function verifyMcpTool(connection: McpConnectionTarget, toolName: string) {
  try {
    const tools = await withMcpClient(connection, client => client.listTools(undefined, { timeout: MCP_CONNECT_TIMEOUT_MS }));

    if (!tools.tools.some(tool => tool.name === toolName)) {
      throw new Error(`The MCP server does not expose a "${toolName}" tool.`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("The MCP server")) throw error;
    throw new Error("Unable to connect to the MCP server. Check the URL and token.");
  }
}

function readToolText(result: Record<string, unknown>) {
  const blocks = Array.isArray(result.content) ? result.content as Array<Record<string, unknown>> : [];
  const text = blocks
    .flatMap(block => block.type === "text" && typeof block.text === "string" ? [block.text] : [])
    .join("\n")
    .trim();

  if (text) return text;

  const structured = result.structuredContent as Record<string, unknown> | undefined;
  return typeof structured?.content === "string" ? structured.content.trim() : "";
}

export async function callMcpAgentTool(input: {
  connection: McpConnectionTarget;
  toolName: string;
  prompt: string;
  isCancelled(): Promise<boolean>;
}) {
  const abortController = new AbortController();
  const cancelPoll = setInterval(() => {
    void input.isCancelled().then(cancelled => {
      if (cancelled) abortController.abort();
    }).catch(() => undefined);
  }, MCP_CANCEL_POLL_INTERVAL_MS);

  try {
    const result = await withMcpClient(input.connection, client => client.callTool(
      { name: input.toolName, arguments: { prompt: input.prompt } },
      undefined,
      { timeout: MCP_CALL_TIMEOUT_MS, signal: abortController.signal },
    ));
    const answer = readToolText(result);

    if (result.isError) throw new Error(answer || "The MCP agent reported an error.");
    if (!answer) throw new Error("The MCP agent returned an empty response.");
    return answer;
  } catch (error) {
    if (abortController.signal.aborted) throw new Error("Task cancelled.");
    throw error instanceof Error ? error : new Error("Unable to reach the MCP agent.");
  } finally {
    clearInterval(cancelPoll);
  }
}
