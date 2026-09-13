import { NextResponse } from "next/server";

const configuredApiKey = process.env.NEXT_PUBLIC_API_KEY ?? process.env.API_KEY;

function isBrowserNavigation(request: Request) {
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

  return configuredApiKey.length === receivedApiKey.length && receivedApiKey === configuredApiKey;
}

export function middleware(request: Request) {
  if (new URL(request.url).pathname === "/api/gmail/callback") {
    return NextResponse.next();
  }
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
