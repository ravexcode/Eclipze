export const GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_OAUTH_SCOPES = ["openid", "email", "profile"];

export const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/google/callback";
export const GOOGLE_OAUTH_COOKIE_PATH = "/api/auth/google";
export const GOOGLE_OAUTH_STATE_COOKIE = "google_oauth_state";
export const GOOGLE_OAUTH_VERIFIER_COOKIE = "google_oauth_verifier";
export const GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10;

export const GOOGLE_OAUTH_TRANSACTION_MAX_WAIT_MS = 10_000;
export const GOOGLE_OAUTH_TRANSACTION_TIMEOUT_MS = 20_000;

export const GOOGLE_OAUTH_ERROR_MESSAGES = {
  google_not_configured: "Google sign-in is not available right now.",
  google_cancelled: "Google sign-in was cancelled.",
  google_invalid_state: "Your Google sign-in session expired. Please try again.",
  google_failed: "We could not sign you in with Google. Please try again.",
  google_email_unverified: "Your Google email address is not verified.",
  google_account_conflict: "This email is already linked to a different Google account.",
} as const;

export type GoogleOAuthErrorCode = keyof typeof GOOGLE_OAUTH_ERROR_MESSAGES;
