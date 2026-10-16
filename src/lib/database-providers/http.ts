import "server-only";

import { DATABASE_REQUEST_TIMEOUT_MS } from "@/constants/database-connections";

function describeFailure(label: string, status: number, detail: string) {
  if (status === 401 || status === 403) return `${label} rejected the saved credential. Reconnect it from the ERD database menu.`;
  if (status === 404) return `${label} could not find that project.`;
  if (status === 429) return `${label} rate limit reached. Try again shortly.`;

  return detail ? `${label} returned an error: ${detail}` : `${label} could not complete the request.`;
}

function readErrorDetail(payload: unknown) {
  if (typeof payload !== "object" || payload === null) return "";

  const record = payload as Record<string, unknown>;
  const detail = record.message ?? record.error ?? record.msg;

  return typeof detail === "string" ? detail.slice(0, 300) : "";
}

export async function requestProviderJson<T>(input: {
  label: string;
  url: string;
  token: string;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
}) {
  const response = await fetch(input.url, {
    method: input.method ?? "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${input.token}`,
      ...(input.body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(DATABASE_REQUEST_TIMEOUT_MS),
  }).catch(() => {
    throw new Error(`${input.label} could not be reached.`);
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null) as unknown;

  if (!response.ok) {
    throw new Error(describeFailure(input.label, response.status, readErrorDetail(payload)));
  }

  return payload as T;
}
