import type { SessionUser } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";

type SessionResponse = {
  user: SessionUser;
};

let cachedUser: SessionUser | null | undefined;
let sessionRequest: Promise<SessionUser | null> | null = null;
let sessionVersion = 0;

async function requestSessionUser() {
  const response = await apiFetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as SessionResponse;
  return data.user;
}

export function getSessionUser() {
  if (cachedUser !== undefined) {
    return Promise.resolve(cachedUser);
  }

  if (!sessionRequest) {
    const requestVersion = sessionVersion;
    const request = requestSessionUser()
      .then(user => {
        if (requestVersion === sessionVersion) {
          cachedUser = user;
        }

        return user;
      });

    sessionRequest = request;
    void request.then(
      () => {
        if (sessionRequest === request) {
          sessionRequest = null;
        }
      },
      () => {
        if (sessionRequest === request) {
          sessionRequest = null;
        }
      },
    );
  }

  return sessionRequest;
}

export function setSessionUser(user: SessionUser) {
  sessionVersion += 1;
  sessionRequest = null;
  cachedUser = user;
}

export function invalidateSessionUser() {
  sessionVersion += 1;
  sessionRequest = null;
  cachedUser = undefined;
}

export function clearSessionUser() {
  sessionVersion += 1;
  sessionRequest = null;
  cachedUser = null;
}
