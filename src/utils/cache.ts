import type { SessionUser, WorkspaceSnapshot } from "@/types/user";
import {
  ISSUES_CACHE_DURATION,
  ISSUES_CACHE_INVALIDATED_EVENT,
  LEGACY_PRIVATE_CACHE_PREFIXES,
} from "@/constants/cache";

type UserRole = SessionUser["role"];

type IssuesCacheEntry<T> = {
  issues: T[];
  unread: number;
  expiresAt: number;
};

const issueEntries = new Map<string, IssuesCacheEntry<unknown>>();

function removeExpiredIssueEntries(now = Date.now()) {
  for (const [key, entry] of issueEntries) {
    if (now >= entry.expiresAt) issueEntries.delete(key);
  }
}

function issuesCacheKey(userId: string, role: UserRole, scopeKey: string) {
  return JSON.stringify([userId, role, scopeKey]);
}

function dispatchIssuesCacheInvalidated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ISSUES_CACHE_INVALIDATED_EVENT));
  }
}

function removeLegacyPrivateCacheRecords(userId?: string) {
  if (typeof window === "undefined") return;

  try {
    const storage = window.localStorage;
    const keys: string[] = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;

      const matchesPrefix = LEGACY_PRIVATE_CACHE_PREFIXES.some(prefix =>
        key.startsWith(prefix),
      );
      if (!matchesPrefix) continue;
      if (userId && !key.startsWith(`eclipze-workspace:${userId}:`) && !key.startsWith(`eclipze-issues:${userId}:`)) {
        continue;
      }

      keys.push(key);
    }

    keys.forEach(key => storage.removeItem(key));
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

/** Removes private cache records written by older versions of the client. */
export function purgeLegacyPrivateCacheRecords() {
  removeLegacyPrivateCacheRecords();
}

/** Clears all ephemeral private data and any legacy persisted copies. */
export function clearPrivateCaches() {
  issueEntries.clear();
  removeLegacyPrivateCacheRecords();
  dispatchIssuesCacheInvalidated();
}

/**
 * Workspace snapshots are intentionally no longer cached. Older callers receive
 * the same result shape while always falling through to the authenticated API.
 */
export default class CacheDB {
  static update(_workspace: WorkspaceSnapshot) {
    return { message: "error" };
  }

  static get(_userId: string): {
    message: string;
    workspace?: WorkspaceSnapshot;
  } {
    return { message: "error" };
  }

  static delete(userId?: string) {
    issueEntries.clear();
    removeLegacyPrivateCacheRecords(userId);
    dispatchIssuesCacheInvalidated();
    return { message: "ok" };
  }
}

export class IssuesCache {
  static update<T>(
    userId: string,
    role: UserRole,
    issues: T[],
    unread: number,
    scopeKey = "default",
  ) {
    if (!userId || typeof unread !== "number" || !Number.isFinite(unread)) return;

    removeExpiredIssueEntries();
    issueEntries.set(issuesCacheKey(userId, role, scopeKey), {
      issues,
      unread,
      expiresAt: Date.now() + ISSUES_CACHE_DURATION,
    });
  }

  static get<T>(userId: string, role: UserRole, scopeKey = "default") {
    if (!userId || typeof window === "undefined") return null;

    removeExpiredIssueEntries();
    const key = issuesCacheKey(userId, role, scopeKey);
    const entry = issueEntries.get(key) as IssuesCacheEntry<T> | undefined;
    if (!entry) return null;

    return { issues: entry.issues, unread: entry.unread };
  }

  static delete(userId?: string, role?: UserRole, scopeKey?: string) {
    if (!userId) {
      issueEntries.clear();
      removeLegacyPrivateCacheRecords();
    } else if (role && scopeKey) {
      issueEntries.delete(issuesCacheKey(userId, role, scopeKey));
      removeLegacyPrivateCacheRecords(userId);
    } else {
      for (const key of issueEntries.keys()) {
        const [entryUserId] = JSON.parse(key) as [string, UserRole, string];
        if (entryUserId === userId) issueEntries.delete(key);
      }
      removeLegacyPrivateCacheRecords(userId);
    }

    dispatchIssuesCacheInvalidated();
  }
}

purgeLegacyPrivateCacheRecords();
