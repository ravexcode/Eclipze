import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { User } from "@prisma/client";

import {
  GOOGLE_AUTHORIZATION_URL,
  GOOGLE_OAUTH_CALLBACK_PATH,
  GOOGLE_OAUTH_SCOPES,
  GOOGLE_TOKEN_URL,
  GOOGLE_USERINFO_URL,
  type GoogleOAuthErrorCode,
} from "@/constants/google-oauth";
import prisma from "@/lib/prisma";
import { createInitialAiCreditGrant } from "@/lib/ai-credits";
import { isValidEmail, normalizeEmail } from "@/lib/auth";

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  picture: string | null;
};

type GoogleUserResult =
  | { user: User }
  | { error: GoogleOAuthErrorCode };

export function getAppOrigin(request: Request) {
  return process.env.APP_URL?.replace(/\/+$/, "") || new URL(request.url).origin;
}

export function getGoogleOAuthConfig(request: Request): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${getAppOrigin(request)}${GOOGLE_OAUTH_CALLBACK_PATH}`,
  };
}

export function createOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function createPkcePair() {
  const codeVerifier = randomBytes(48).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  return {
    codeVerifier,
    codeChallenge,
  };
}

export function createGoogleAuthorizationUrl(input: {
  config: GoogleOAuthConfig;
  state: string;
  codeChallenge: string;
}) {
  const url = new URL(GOOGLE_AUTHORIZATION_URL);

  url.searchParams.set("client_id", input.config.clientId);
  url.searchParams.set("redirect_uri", input.config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_OAUTH_SCOPES.join(" "));
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function fetchGoogleProfile(input: {
  config: GoogleOAuthConfig;
  code: string;
  codeVerifier: string;
}): Promise<GoogleProfile | null> {
  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.config.clientId,
      client_secret: input.config.clientSecret,
      redirect_uri: input.config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: input.codeVerifier,
    }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokens = await tokenResponse.json() as { access_token?: string };

  if (!tokens.access_token) {
    return null;
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    return null;
  }

  const profile = await profileResponse.json() as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    picture?: string;
  };

  if (!profile.sub || !profile.email || !isValidEmail(profile.email)) {
    return null;
  }

  return {
    sub: profile.sub,
    email: normalizeEmail(profile.email),
    emailVerified: profile.email_verified === true,
    picture: profile.picture ?? null,
  };
}

export async function findOrCreateGoogleUser(profile: GoogleProfile): Promise<GoogleUserResult> {
  if (!profile.emailVerified) {
    return {
      error: "google_email_unverified",
    };
  }

  return prisma.$transaction(async (transaction): Promise<GoogleUserResult> => {
    const linkedAccount = await transaction.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "GOOGLE",
          providerAccountId: profile.sub,
        },
      },
      include: {
        user: true,
      },
    });

    if (linkedAccount) {
      return {
        user: linkedAccount.user,
      };
    }

    const existingUser = await transaction.user.findUnique({
      where: {
        email: profile.email,
      },
    });

    if (existingUser) {
      const existingGoogleAccount = await transaction.authAccount.findUnique({
        where: {
          userId_provider: {
            userId: existingUser.id,
            provider: "GOOGLE",
          },
        },
      });

      if (existingGoogleAccount) {
        return {
          error: "google_account_conflict",
        };
      }

      await transaction.authAccount.create({
        data: {
          userId: existingUser.id,
          provider: "GOOGLE",
          providerAccountId: profile.sub,
        },
      });

      // An unverified account was never proven to belong to this email owner,
      // so its password is discarded before Google verifies the address.
      const updatedUser = await transaction.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
          passwordHash: existingUser.emailVerifiedAt ? existingUser.passwordHash : null,
          avatarUrl: existingUser.avatarUrl ?? profile.picture,
        },
      });

      return {
        user: updatedUser,
      };
    }

    const createdUser = await transaction.user.create({
      data: {
        email: profile.email,
        avatarUrl: profile.picture,
        emailVerifiedAt: new Date(),
        role: "USER",
        accounts: {
          create: {
            provider: "GOOGLE",
            providerAccountId: profile.sub,
          },
        },
      },
    });

    await createInitialAiCreditGrant(transaction, createdUser.id);

    return {
      user: createdUser,
    };
  });
}
