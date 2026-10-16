"use client";

import { useCallback, useRef, useState } from "react";

import { ERD_AGENT_MAX_MESSAGES } from "@/constants/erd";
import type { DatabaseTarget } from "@/types/database-connections";
import type { ErdAgentMessage, ErdAgentResponse, ErdDocument } from "@/types/erd";
import { apiFetch } from "@/utils/api-fetch";
import { createErdId } from "@/utils/erd";
import { errorMessage, readJson } from "@/utils/json-payload";

export function useErdAgentChat(input: {
  projectId: string | null;
  document: ErdDocument;
  onDocumentChange(document: ErdDocument): void;
}) {
  const [messages, setMessages] = useState<ErdAgentMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  const send = useCallback(async (content: string, agentId: string, database: DatabaseTarget | null) => {
    const text = content.trim();

    if (!text || !input.projectId || isSendingRef.current) {
      return;
    }

    const userMessage: ErdAgentMessage = { id: createErdId(), role: "user", content: text };
    // Failed replies stay visible but are not sent back as conversation history.
    const history = [...messages, userMessage]
      .filter(message => !message.isError)
      .slice(-ERD_AGENT_MAX_MESSAGES)
      .map(message => ({ role: message.role, content: message.content }));

    isSendingRef.current = true;
    setIsSending(true);
    setMessages(current => [...current, userMessage]);

    try {
      const response = await apiFetch("/api/erd/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: input.projectId,
          agentId,
          database,
          document: input.document,
          messages: history,
        }),
      });
      const payload = await readJson(response) as ErdAgentResponse | null;

      if (!response.ok || !payload?.answer) {
        throw new Error(errorMessage(payload, "The agent could not respond."));
      }

      if (payload.document) {
        input.onDocumentChange(payload.document);
      }

      setMessages(current => [
        ...current,
        {
          id: createErdId(),
          role: "assistant",
          content: payload.answer,
          changes: payload.changes ?? undefined,
        },
      ]);
    } catch (error) {
      setMessages(current => [
        ...current,
        {
          id: createErdId(),
          role: "assistant",
          content: error instanceof Error ? error.message : "The agent could not respond.",
          isError: true,
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  }, [input, messages]);

  return {
    messages,
    isSending,
    send,
    clear: () => setMessages([]),
  };
}
