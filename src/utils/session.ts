import type { SessionUser } from "@/types/user";
import { apiFetch } from "@/utils/api-fetch";
import { clearPrivateCaches } from "@/utils/cache";

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
  const previousUser = cachedUser;
  sessionVersion += 1;
  sessionRequest = null;
  cachedUser = user;

  if (previousUser && (previousUser.id !== user.id || previousUser.role !== user.role || previousUser.plan !== user.plan)) {
    clearPrivateCaches();
  }
}

export function invalidateSessionUser() {
  sessionVersion += 1;
  sessionRequest = null;
  cachedUser = undefined;
  clearPrivateCaches();
}

export function clearSessionUser() {
  sessionVersion += 1;
  sessionRequest = null;
  cachedUser = null;
  clearPrivateCaches();
}

/** Forces a fresh authenticated session read, useful when revalidating role. */
export function refreshSessionUser() {
  const previousUser = cachedUser;
  sessionVersion += 1;
  sessionRequest = null;
  cachedUser = undefined;
  return getSessionUser().then(user => {
    if (previousUser && (!user || user.id !== previousUser.id || user.role !== previousUser.role)) {
      clearPrivateCaches();
    }

    return user;
  });
}
