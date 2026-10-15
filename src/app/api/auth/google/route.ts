import { NextResponse } from "next/server";

import {
  GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
  GOOGLE_OAUTH_COOKIE_PATH,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
} from "@/constants/google-oauth";
import {
  createGoogleAuthorizationUrl,
  createOAuthState,
  createPkcePair,
  getAppOrigin,
  getGoogleOAuthConfig,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  const config = getGoogleOAuthConfig(request);

  if (!config) {
    return NextResponse.redirect(new URL("/auth/signin?error=google_not_configured", getAppOrigin(request)));
  }

  const state = createOAuthState();
  const { codeVerifier, codeChallenge } = createPkcePair();

  const response = NextResponse.redirect(createGoogleAuthorizationUrl({
    config,
    state,
    codeChallenge,
  }));

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: GOOGLE_OAUTH_COOKIE_PATH,
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
  };

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, codeVerifier, cookieOptions);

  return response;
}
