import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { exchangeCode, saveConnection } from "@/lib/gmail";

type GmailOAuthState = {
  state: string;
  verifier: string;
  returnTo?: string;
};

function isGmailOAuthState(value: unknown): value is GmailOAuthState {
  if (typeof value !== "object" || value === null) return false;

  const state = value as Record<string, unknown>;
  return (
    typeof state.state === "string" &&
    typeof state.verifier === "string" &&
    (state.returnTo === undefined || typeof state.returnTo === "string")
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stateCookie = (await cookies()).get("gmail_oauth_state");
  const fallback = "/mails";

  if (!stateCookie) {
    return NextResponse.redirect(
      new URL(`${fallback}?gmail=error`, request.url),
    );
  }

  let state: GmailOAuthState;
  try {
    const parsed: unknown = JSON.parse(stateCookie.value);
    if (!isGmailOAuthState(parsed)) throw new Error("Invalid OAuth state");
    state = parsed;
  } catch {
    return NextResponse.redirect(
      new URL(`${fallback}?gmail=error`, request.url),
    );
  }

  if (url.searchParams.get("state") !== state.state) {
    return NextResponse.redirect(
      new URL(`${fallback}?gmail=error`, request.url),
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/auth", request.url));

  try {
    const token = await exchangeCode(
      url.searchParams.get("code") ?? "",
      state.verifier,
    );
    const profile = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      },
    );
    if (!profile.ok) throw new Error("profile");

    const data = (await profile.json()) as { emailAddress: string };
    const scopes = token.scope?.split(" ") ?? [];
    await saveConnection(
      user.id,
      data.emailAddress,
      token.refresh_token ?? "",
      scopes,
    );
    (await cookies()).delete("gmail_oauth_state");

    return NextResponse.redirect(
      new URL(`${state.returnTo ?? fallback}?gmail=connected`, request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL(`${state.returnTo ?? fallback}?gmail=error`, request.url),
    );
  }
}
