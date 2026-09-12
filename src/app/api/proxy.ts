import { NextResponse } from "next/server";

const configuredApiKey = process.env.NEXT_PUBLIC_API_KEY ?? process.env.API_KEY;

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
}

function hasValidApiKey(request: Request) {
  const receivedApiKey = request.headers.get("x-api-key");

  if (!configuredApiKey || !receivedApiKey) {
    return false;
  }

  if (configuredApiKey.length !== receivedApiKey.length) {
    return false;
  }

  return receivedApiKey === configuredApiKey;
}

export function proxy(request: Request) {
  if (isBrowserNavigation(request)) {
    return NextResponse.redirect(new URL("/not-authorized", request.url), 302);
  }

  if (!configuredApiKey) {
    return NextResponse.json(
      { message: "The API key is not configured." },
      { status: 503 },
    );
  }

  if (!hasValidApiKey(request)) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    message: "Proxy is working.",
  });
}

export const GET = proxy;
export const POST = proxy;
