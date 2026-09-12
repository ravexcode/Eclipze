import "server-only";

import {
  createCipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY_ENV = "AI_CREDENTIALS_ENCRYPTION_KEY";

function getEncryptionKey() {
  const secret = process.env.AI_CREDENTIALS_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error(`${ENCRYPTION_KEY_ENV} is not configured.`);
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}
