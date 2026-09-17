import "server-only";

import {
  createHash,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@/lib/prisma";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE_NAME = "token";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_ACTIVITY_WRITE_INTERVAL_MS = 1000 * 60 * 5;
const VERIFICATION_CODE_TTL_MS = 1000 * 60 * 10;

export type AuthCodePurpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string) {
  return password.length >= 8;
}

export function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_-]{3,24}$/.test(username);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}

export function generateVerificationCode(length = 6) {
  let code = "";

  for (let index = 0; index < length; index += 1) {
    code += randomInt(0, 10).toString();
  }

  return code;
}

function createCodeHash(userId: string, purpose: AuthCodePurpose, code: string) {
  return hashSecret(`${userId}:${purpose}:${code}`);
}

function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function serializeUser(user: {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  role: "USER" | "DEVELOPER";
  emailVerifiedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.username ?? user.email.split("@")[0],
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt.toISOString(),
  };
}

export async function createVerificationCode(input: {
  userId: string;
  purpose: AuthCodePurpose;
}) {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

  await prisma.verificationCode.deleteMany({
    where: {
      userId: input.userId,
      purpose: input.purpose,
      consumedAt: null,
    },
  });

  await prisma.verificationCode.create({
    data: {
      userId: input.userId,
      purpose: input.purpose,
      codeHash: createCodeHash(input.userId, input.purpose, code),
      expiresAt,
    },
  });

  return {
    code,
    expiresAt,
  };
}

export async function consumeVerificationCode(input: {
  email: string;
  purpose: AuthCodePurpose;
  code: string;
}) {
  const user = await prisma.user.findUnique({
    where: {
      email: normalizeEmail(input.email),
    },
  });

  if (!user) {
    return null;
  }

  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      userId: user.id,
      purpose: input.purpose,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
      codeHash: createCodeHash(user.id, input.purpose, input.code),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verificationCode) {
    return null;
  }

  await prisma.verificationCode.update({
    where: {
      id: verificationCode.id,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  return user;
}

export async function resetPasswordWithCode(input: { email: string; code: string; passwordHash: string }) {
  const email = normalizeEmail(input.email);
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { email } });
    if (!user?.emailVerifiedAt) return false;
    const verificationCode = await transaction.verificationCode.findFirst({
      where: { userId: user.id, purpose: "PASSWORD_RESET", consumedAt: null, expiresAt: { gt: new Date() }, codeHash: createCodeHash(user.id, "PASSWORD_RESET", input.code) },
      orderBy: { createdAt: "desc" },
    });
    if (!verificationCode) return false;
    await transaction.verificationCode.update({ where: { id: verificationCode.id }, data: { consumedAt: new Date() } });
    await transaction.user.update({ where: { id: user.id }, data: { passwordHash: input.passwordHash } });
    await transaction.authSession.deleteMany({ where: { userId: user.id } });
    return true;
  });
}

export async function createSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashSecret(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "Unknown";
}

export function describeDevice(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  const device = /mobile|android|iphone|ipad/i.test(userAgent) ? "Mobile device" : "Desktop device";
  const browser = /edg\//i.test(userAgent) ? "Microsoft Edge" : /firefox\//i.test(userAgent) ? "Mozilla Firefox" : /chrome\//i.test(userAgent) ? "Google Chrome" : /safari\//i.test(userAgent) ? "Safari" : "Unknown browser";
  return `${device} · ${browser}`;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.authSession.deleteMany({
      where: {
        tokenHash: hashSecret(token),
      },
    });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.authSession.findUnique({
    where: {
      tokenHash: hashSecret(token),
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.authSession.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  const shouldUpdateActivity = !session.lastUsedAt ||
    Date.now() - session.lastUsedAt.getTime() >= SESSION_ACTIVITY_WRITE_INTERVAL_MS;

  if (shouldUpdateActivity) {
    await prisma.authSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();

  return session?.user ?? null;
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return user;
}
