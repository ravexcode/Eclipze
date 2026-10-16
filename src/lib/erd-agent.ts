import "server-only";

import {
  DATABASE_MAX_STATEMENT_LENGTH,
  DATABASE_MAX_STATEMENTS,
  DATABASE_PROVIDER_LABELS,
  DATABASE_PROVIDERS,
} from "@/constants/database-connections";
import {
  ERD_AGENT_MAX_ANSWER_LENGTH,
  ERD_AGENT_MAX_TOOL_CYCLES,
  ERD_AGENT_MAX_TOOL_RESULT_LENGTH,
} from "@/constants/erd";
import { ERD_AGENT_SYSTEM_INSTRUCTIONS, ERD_AGENT_TOOLS } from "@/constants/erd-agent";
import { PROVIDER_LABELS } from "@/constants/agent-providers";
import { requestChatCompletion, type ChatMessage } from "@/lib/agent-providers";
import { DATABASE_PROVIDER_CLIENTS } from "@/lib/database-providers";
import type { DatabaseCredential } from "@/lib/database-providers/types";
import { parseErdDocument } from "@/lib/erd";
import type { AiProvider } from "@/types/ai";
import type { ErdDatabaseChange, ErdDocument } from "@/types/erd";
import {
  buildErdFromAgentSchema,
  diffErdWithMongo,
  diffErdWithPostgres,
  summarizeDatabaseSchemaForAgent,
  summarizeErdForAgent,
} from "@/utils/erd-agent";

export type ErdAgentDatabase = {
  credential: DatabaseCredential;
  projectId: string;
};

type ErdAgentState = {
  document: ErdDocument;
  documentChanged: boolean;
  changes: ErdDatabaseChange[] | null;
};

function readAssistantText(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";

  return value.flatMap(part => {
    if (!part || typeof part !== "object") return [];

    const text = (part as Record<string, unknown>).text;

    return typeof text === "string" ? [text] : [];
  }).join("\n");
}

function describeDatabaseTarget(database: ErdAgentDatabase | null) {
  if (!database) {
    return "Database: none connected. Database tools are unavailable; if the user asks for them, tell them to connect a database with the Database button in the ERD toolbar.";
  }

  const provider = database.credential.provider;
  const isSql = DATABASE_PROVIDERS.find(item => item.id === provider)?.isSql ?? true;
  const dialect = isSql
    ? "PostgreSQL. Statements for update_database are PostgreSQL."
    : "MongoDB. Each update_database statement is one JSON database command: create, collMod, drop, createIndexes, or dropIndexes. Relations are documented in the ERD only.";

  return `Database: ${DATABASE_PROVIDER_LABELS[provider]} project \`${database.projectId}\`. Dialect: ${dialect}`;
}

function requireDatabase(database: ErdAgentDatabase | null) {
  if (!database) {
    throw new Error("No database is connected. Ask the user to connect one with the Database button in the ERD toolbar.");
  }

  return database;
}

function readStatements(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("statements must be a non-empty array.");
  }

  if (value.length > DATABASE_MAX_STATEMENTS) {
    throw new Error(`Send up to ${DATABASE_MAX_STATEMENTS} statements per call.`);
  }

  return value.map(statement => {
    if (typeof statement !== "string" || !statement.trim()) {
      throw new Error("Every statement must be a non-empty string.");
    }

    if (statement.length > DATABASE_MAX_STATEMENT_LENGTH) {
      throw new Error("A statement is too long.");
    }

    return statement.trim();
  });
}

async function runErdAgentTool(name: string, args: Record<string, unknown>, state: ErdAgentState, database: ErdAgentDatabase | null) {
  if (name === "update_erd") {
    const built = buildErdFromAgentSchema(state.document, args);

    if (built.error !== undefined) throw new Error(built.error);

    const document = parseErdDocument(built.value);

    if (document.error !== undefined) throw new Error(document.error);

    state.document = document.value;
    state.documentChanged = true;

    return `ERD updated with ${document.value.tables.length} table(s) and ${document.value.relations.length} relation(s). The editor now shows it and saves it automatically.`;
  }

  if (name === "inspect_database") {
    const target = requireDatabase(database);
    const schema = await DATABASE_PROVIDER_CLIENTS[target.credential.provider].inspect(target.credential, target.projectId);

    return schema.tables.length > 0
      ? summarizeDatabaseSchemaForAgent(schema)
      : "The database has no tables or collections yet.";
  }

  if (name === "review_changes") {
    const target = requireDatabase(database);
    const schema = await DATABASE_PROVIDER_CLIENTS[target.credential.provider].inspect(target.credential, target.projectId);
    const changes = target.credential.provider === "MONGODB"
      ? diffErdWithMongo(state.document, schema)
      : diffErdWithPostgres(state.document, schema);

    state.changes = changes;

    if (changes.length === 0) {
      return "The database already matches the ERD. No changes are needed.";
    }

    return JSON.stringify(changes.map((change, index) => ({ number: index + 1, ...change })));
  }

  if (name === "update_database") {
    const target = requireDatabase(database);
    const statements = readStatements(args.statements);
    const result = await DATABASE_PROVIDER_CLIENTS[target.credential.provider].execute(target.credential, target.projectId, statements);

    state.changes = null;

    return result;
  }

  throw new Error("The requested tool is not available.");
}

export async function runErdAgent(input: {
  provider: AiProvider;
  apiKey: string;
  model: string;
  userId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  document: ErdDocument;
  database: ErdAgentDatabase | null;
}) {
  const state: ErdAgentState = {
    document: input.document,
    documentChanged: false,
    changes: null,
  };
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: [
        ERD_AGENT_SYSTEM_INSTRUCTIONS,
        "",
        describeDatabaseTarget(input.database),
        "",
        `Current ERD (JSON): ${summarizeErdForAgent(input.document)}`,
      ].join("\n"),
    },
    ...input.messages,
  ];

  let totalCostUsd = 0;
  let hasReportedCost = false;

  for (let cycle = 0; cycle < ERD_AGENT_MAX_TOOL_CYCLES; cycle += 1) {
    const completion = await requestChatCompletion({
      provider: input.provider,
      apiKey: input.apiKey,
      model: input.model,
      userId: input.userId,
      messages,
      tools: ERD_AGENT_TOOLS,
    });

    if (completion.costUsd !== null) {
      totalCostUsd += completion.costUsd;
      hasReportedCost = true;
    }

    if (completion.toolCalls.length === 0) {
      const answer = readAssistantText(completion.content).trim();

      if (!answer) throw new Error(`${PROVIDER_LABELS[input.provider]} returned an empty response.`);

      return {
        answer: answer.slice(0, ERD_AGENT_MAX_ANSWER_LENGTH),
        document: state.documentChanged ? state.document : null,
        changes: state.changes,
        costUsd: hasReportedCost ? totalCostUsd : null,
      };
    }

    messages.push({ role: "assistant", content: completion.content ?? null, tool_calls: completion.toolCalls });

    for (const toolCall of completion.toolCalls) {
      let toolArgs: Record<string, unknown>;

      try {
        const parsed = JSON.parse(toolCall.function?.arguments || "{}") as unknown;

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Tool input must be a JSON object.");

        toolArgs = parsed as Record<string, unknown>;
      } catch {
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: "Invalid tool arguments." });
        continue;
      }

      let result: string;

      try {
        result = await runErdAgentTool(toolCall.function?.name ?? "", toolArgs, state, input.database);
      } catch (error) {
        result = `Tool failed: ${error instanceof Error ? error.message : "Unknown error."}`;
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.slice(0, ERD_AGENT_MAX_TOOL_RESULT_LENGTH),
      });
    }
  }

  // Keep the work done so far: the diagram or database may already have changed.
  return {
    answer: "I reached my tool-use limit for this message. Send a follow-up message to continue.",
    document: state.documentChanged ? state.document : null,
    changes: state.changes,
    costUsd: hasReportedCost ? totalCostUsd : null,
  };
}
