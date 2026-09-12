import CacheDB from "@/utils/cache";

const apiKey = process.env.NEXT_PUBLIC_API_KEY;

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_API_KEY is not configured."));
  }

  const headers = new Headers(init.headers);
  headers.set("x-api-key", apiKey);

  const response = await fetch(input, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  const method = (init.method ?? "GET").toUpperCase();
  if (response.ok && method !== "GET" && method !== "HEAD") {
    CacheDB.delete();
  }

  return response;
}
