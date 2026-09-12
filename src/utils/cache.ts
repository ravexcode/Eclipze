import { AES, enc } from "crypto-ts";

import type { WorkspaceSnapshot } from "@/types/user";

const CRYPTO_SK = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY!;

const CACHE_KEY_PREFIX = "eclipse-workspace";
const CACHE_VERSION = 2;
const CACHE_DURATION = 3 * 60 * 60 * 1000;

interface CacheData {
  version: number;
  userId: string;
  workspace: WorkspaceSnapshot;
  expiration: number;
}

function cacheKey(userId: string) {
  return `${CACHE_KEY_PREFIX}:${userId}:v${CACHE_VERSION}`;
}

function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (!value || typeof value !== "object") return false;
  const workspace = value as Partial<WorkspaceSnapshot>;
  return Boolean(
    workspace.user &&
    typeof workspace.user.id === "string" &&
    Array.isArray(workspace.projects) &&
    Array.isArray(workspace.issues) &&
    Array.isArray(workspace.mails) &&
    Array.isArray(workspace.agents) &&
    Array.isArray(workspace.agentSessions) &&
    workspace.metrics &&
    typeof workspace.metrics === "object"
  );
}

export default class CacheDB {
  static update(workspace: WorkspaceSnapshot) {
    if (!CRYPTO_SK) {
      throw new Error("CRYPTO_SECRET_KEY is not configured");
    }

    if (typeof window === "undefined") {
      return {
        message: "error",
      };
    }

    const content: CacheData = {
      version: CACHE_VERSION,
      userId: workspace.user.id,
      workspace,
      expiration: Date.now() + CACHE_DURATION,
    };

    const encrypted = AES.encrypt(
      JSON.stringify(content),
      CRYPTO_SK
    ).toString();

    window.localStorage.setItem(cacheKey(workspace.user.id), encrypted);

    return {
      message: "ok",
    };
  }

  static delete(userId?: string) {
    if (typeof window === "undefined") {
      return {
        message: "error",
      };
    }

    if (userId) {
      window.localStorage.removeItem(cacheKey(userId));
    } else {
      const keysToDelete: string[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith(`${CACHE_KEY_PREFIX}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => window.localStorage.removeItem(key));
    }

    return {
      message: "ok",
    };
  }

  static get(userId: string): {
    message: string;
    workspace?: WorkspaceSnapshot;
  } {
    if (!CRYPTO_SK || typeof window === "undefined") {
      return {
        message: "error",
      };
    }

    const encrypted = window.localStorage.getItem(cacheKey(userId));

    if (!encrypted) {
      return {
        message: "error",
      };
    }

    try {
      const decryptedRaw = AES.decrypt(
        encrypted,
        CRYPTO_SK
      );

      const decrypted = decryptedRaw.toString(enc.Utf8);
      const cache = JSON.parse(decrypted) as Partial<CacheData>;

      if (
        cache.version !== CACHE_VERSION ||
        cache.userId !== userId ||
        typeof cache.expiration !== "number" ||
        Date.now() >= cache.expiration ||
        !isWorkspaceSnapshot(cache.workspace) ||
        cache.workspace.user.id !== userId
      ) {
        this.delete(userId);
        return { message: "error" };
      }

      return { message: "ok", workspace: cache.workspace };
    } catch {
      this.delete(userId);

      return {
        message: "error",
      };
    }
  }
}
