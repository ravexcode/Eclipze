import { GOOGLE_OAUTH_ERROR_MESSAGES } from "@/constants/google-oauth";

export function getGoogleOAuthErrorMessage(errorCode: string | undefined) {
  if (!errorCode || !(errorCode in GOOGLE_OAUTH_ERROR_MESSAGES)) {
    return null;
  }

  return GOOGLE_OAUTH_ERROR_MESSAGES[errorCode as keyof typeof GOOGLE_OAUTH_ERROR_MESSAGES];
}
