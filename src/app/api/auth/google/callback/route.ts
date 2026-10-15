import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  GOOGLE_OAUTH_COOKIE_PATH,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  type GoogleOAuthErrorCode,
} from "@/constants/google-oauth";
import {
  createSession,
  describeDevice,
  getRequestIp,
} from "@/lib/auth";
import { sendNewSignInEmail } from "@/lib/auth-email";
import {
  fetchGoogleProfile,
  findOrCreateGoogleUser,
  getAppOrigin,
  getGoogleOAuthConfig,
} from "@/lib/google-oauth";

export async function GET(request: Request) {
  const appOrigin = getAppOrigin(request);
  const searchParams = new URL(request.url).searchParams;
  const cookieStore = await cookies();

  const storedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const codeVerifier = cookieStore.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value;

  cookieStore.delete({ name: GOOGLE_OAUTH_STATE_COOKIE, path: GOOGLE_OAUTH_COOKIE_PATH });
  cookieStore.delete({ name: GOOGLE_OAUTH_VERIFIER_COOKIE, path: GOOGLE_OAUTH_COOKIE_PATH });

  const redirectWithError = (errorCode: GoogleOAuthErrorCode) => {
    return NextResponse.redirect(new URL(`/auth/signin?error=${errorCode}`, appOrigin));
  };

  const config = getGoogleOAuthConfig(request);

  if (!config) {
    return redirectWithError("google_not_configured");
  }

  if (searchParams.get("error")) {
    return redirectWithError("google_cancelled");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return redirectWithError("google_invalid_state");
  }

  const profile = await fetchGoogleProfile({
    config,
    code,
    codeVerifier,
  }).catch(() => null);

  if (!profile) {
    return redirectWithError("google_failed");
  }

  const result = await findOrCreateGoogleUser(profile).catch(() => ({
    error: "google_failed" as GoogleOAuthErrorCode,
  }));

  if ("error" in result) {
    return redirectWithError(result.error);
  }

  await createSession(result.user.id);
  void sendNewSignInEmail({
    to: result.user.email,
    ip: getRequestIp(request),
    device: describeDevice(request.headers.get("user-agent")),
    occurredAt: new Date().toISOString(),
  }).catch(() => undefined);

  return NextResponse.redirect(new URL("/dashboard", appOrigin));
}
