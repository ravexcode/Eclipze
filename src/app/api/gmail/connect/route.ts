import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import {
  createOauthState,
  oauthConfig,
  GMAIL_READONLY_SCOPE,
  GMAIL_SEND_SCOPE,
} from "@/lib/gmail";
export async function GET(request: Request) {
  if (!(await getCurrentUser()))
    return NextResponse.redirect(new URL("/auth", request.url));
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "send" ? "send" : "read";
  const returnTo = url.searchParams.get("returnTo")?.startsWith("/mails")
    ? url.searchParams.get("returnTo")!
    : "/mails";
  const state = createOauthState(returnTo);
  (await cookies()).set("gmail_oauth_state", JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  const config = oauthConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope:
      mode === "send"
        ? `${GMAIL_READONLY_SCOPE} ${GMAIL_SEND_SCOPE}`
        : GMAIL_READONLY_SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state: state.state,
    code_challenge: state.challenge,
    code_challenge_method: "S256",
  });
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  if (request.headers.get("x-gmail-connect") === "1") {
    return NextResponse.json(
      { redirect: redirectUrl },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
  return NextResponse.redirect(redirectUrl);
}
