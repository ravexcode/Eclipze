import { AES, enc } from "crypto-ts";

import type { UserProfile } from "@/types/user";

const CRYPTO_SK = process.env.NEXT_PUBLIC_CRYPTO_SECRET_KEY!;

const CACHE_KEY = "user-profile";
const CACHE_DURATION = 3 * 60 * 60 * 1000;

interface CacheData {
  user: UserProfile;
  expiration: number;
}

export default class CacheDB {
  static update(user: UserProfile) {
    if (!CRYPTO_SK) {
      throw new Error("CRYPTO_SECRET_KEY is not configured");
    }

    if (typeof window === "undefined") {
      return {
        message: "error",
      };
    }

    const content: CacheData = {
      user,
      expiration: Date.now() + CACHE_DURATION,
    };

    const encrypted = AES.encrypt(
      JSON.stringify(content),
      CRYPTO_SK
    ).toString();

    window.localStorage.setItem(CACHE_KEY, encrypted);

    return {
      message: "ok",
    };
  }

  static delete() {
    if (typeof window === "undefined") {
      return {
        message: "error",
      };
    }

    window.localStorage.removeItem(CACHE_KEY);

    return {
      message: "ok",
    };
  }

  static get(): {
    message: string;
    user?: UserProfile;
  } {
    if (!CRYPTO_SK || typeof window === "undefined") {
      return {
        message: "error",
      };
    }

    const encrypted = window.localStorage.getItem(CACHE_KEY);

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

      if (!decrypted) {
        this.delete();

        return {
          message: "error",
        };
      }

      const cache: CacheData = JSON.parse(decrypted);

      if (Date.now() >= cache.expiration) {
        this.delete();

        return {
          message: "error",
        };
      }

      return {
        message: "ok",
        user: cache.user as UserProfile,
      };
    } catch {
      this.delete();

      return {
        message: "error",
      };
    }
  }
}
