import { readMessage } from "@/utils/agents/normalizers";

export async function readJson(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

export function errorMessage(payload: unknown, fallback: string) {
  return readMessage(payload, fallback);
}
