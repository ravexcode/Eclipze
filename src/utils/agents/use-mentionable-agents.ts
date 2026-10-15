"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/utils/api-fetch";
import { readJson } from "@/utils/json-payload";
import type { MentionableAgent } from "@/utils/agents/mentions";

type AgentPayload = MentionableAgent & { status: string };

export function useMentionableAgents() {
  const [agents, setAgents] = useState<MentionableAgent[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      try {
        const response = await apiFetch("/api/agents", { cache: "no-store" });
        const payload = await readJson(response) as { agents?: AgentPayload[] };
        if (cancelled || !response.ok) return;

        setAgents((payload.agents ?? []).filter(agent => agent.status === "ACTIVE"));
      } catch {
        if (!cancelled) setAgents([]);
      }
    }

    void loadAgents();
    return () => { cancelled = true; };
  }, []);

  return agents;
}
