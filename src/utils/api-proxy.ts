export const configuredApiKey = process.env.NEXT_PUBLIC_API_KEY ?? process.env.API_KEY;

export function isBrowserNavigation(request: Request) {
  const fetchMode = request.headers.get("sec-fetch-mode");
  const fetchDestination = request.headers.get("sec-fetch-dest");
  const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;

  return (
    fetchMode === "navigate" && fetchDestination === "document"
  ) || (
    !fetchMode &&
    !fetchDestination &&
    acceptsHtml
  );
};

// --- Authentification ---
export function hasValidApiKey(request: Request) {
  const receivedApiKey = request.headers.get("x-api-key");

  if (!configuredApiKey || !receivedApiKey) {
    return false;
  }

  if (configuredApiKey.length !== receivedApiKey.length) {
    return false;
  }

  return receivedApiKey === configuredApiKey;
};
