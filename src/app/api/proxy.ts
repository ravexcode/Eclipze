import { NextResponse } from "next/server";

import { isBrowserNavigation, hasValidApiKey } from "@/utils/api-proxy";

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
