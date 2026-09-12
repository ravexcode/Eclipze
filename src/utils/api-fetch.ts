const apiKey = process.env.NEXT_PUBLIC_API_KEY;

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_API_KEY is not configured."));
  }

  const headers = new Headers(init.headers);
  headers.set("x-api-key", apiKey);

  return fetch(input, {
    ...init,
    headers,
  });
}
