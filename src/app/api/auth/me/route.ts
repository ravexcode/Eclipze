import { NextResponse } from "next/server";

import {
  clearSession,
  getCurrentSession,
  hashPassword,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
  serializeUser,
  verifyPassword,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ACCOUNT_DELETION_DELAY_DAYS } from "@/types/user";
import { isValidAvatarUrl, normalizeAvatarUrl } from "@/utils/avatar-url";
import { Prisma } from "../../../../../prisma/generated/client/index.js";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const session = await getCurrentSession();
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  return NextResponse.json({
    user: serializeUser(user),
  }, { headers: PRIVATE_NO_STORE_HEADERS });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const data: {
    avatarUrl?: string | null;
    username?: string;
    passwordHash?: string;
  } = {};

  if ("avatarUrl" in body) {
    if (body.avatarUrl !== null && typeof body.avatarUrl !== "string") {
      return NextResponse.json({ message: "avatarUrl must be a string." }, { status: 400 });
    }

    const avatarUrl = normalizeAvatarUrl(body.avatarUrl as string | null ?? "");

    if (avatarUrl && !isValidAvatarUrl(avatarUrl)) {
      return NextResponse.json({ message: "Please enter a valid image URL." }, { status: 400 });
    }

    data.avatarUrl = avatarUrl || null;
  }

  if ("username" in body) {
    if (typeof body.username !== "string") {
      return NextResponse.json({ message: "Username must be a string." }, { status: 400 });
    }

    const username = normalizeUsername(body.username);

    if (!isValidUsername(username)) {
      return NextResponse.json({ message: "Username must be 3-24 characters and use only letters, numbers, underscores, or hyphens." }, { status: 400 });
    }

    data.username = username;
  }

  const passwordFields = ["currentPassword", "password", "passwordConfirm"];
  const hasPasswordChange = passwordFields.some(field => field in body);

  if (hasPasswordChange) {
    if (
      typeof body.currentPassword !== "string" ||
      typeof body.password !== "string" ||
      typeof body.passwordConfirm !== "string" ||
      !body.currentPassword ||
      !body.password ||
      !body.passwordConfirm
    ) {
      return NextResponse.json({ message: "Current password, new password, and password confirmation are required." }, { status: 400 });
    }

    if (!user.passwordHash || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
    }

    if (!isValidPassword(body.password)) {
      return NextResponse.json({ message: "Password must be at least 8 characters long." }, { status: 400 });
    }

    if (body.password !== body.passwordConfirm) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }

    data.passwordHash = await hashPassword(body.password);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "No profile changes provided." }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.$transaction(async transaction => {
      if (data.username && data.username !== user.username) {
        const existingUser = await transaction.user.findUnique({
          where: { username: data.username },
          select: { id: true },
        });

        if (existingUser && existingUser.id !== user.id) {
          return null;
        }
      }

      const nextUser = await transaction.user.update({
        where: { id: user.id },
        data,
      });

      if (data.passwordHash) {
        await transaction.authSession.deleteMany({
          where: {
            userId: user.id,
            id: { not: session.id },
          },
        });
      }

      return nextUser;
    });

    if (!updatedUser) {
      return NextResponse.json({ message: "That username is already taken." }, { status: 409 });
    }

    const changedPassword = Boolean(data.passwordHash);
    const changedUsername = Boolean(data.username);
    const message = changedPassword && changedUsername
      ? "Profile and password updated successfully."
      : changedPassword
        ? "Password updated successfully."
        : "Profile updated successfully.";

    return NextResponse.json({
      message,
      user: serializeUser(updatedUser),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "That username is already taken." }, { status: 409 });
    }

    throw error;
  }
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const deletionAvailableAt = new Date(user.createdAt.getTime());
  deletionAvailableAt.setUTCDate(deletionAvailableAt.getUTCDate() + ACCOUNT_DELETION_DELAY_DAYS);

  if (new Date() < deletionAvailableAt) {
    return NextResponse.json({
      message: `Account deletion is available after ${deletionAvailableAt.toISOString().slice(0, 10)}.`,
    }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!body || typeof body.password !== "string" || !body.password) {
    return NextResponse.json({ message: "Current password is required." }, { status: 400 });
  }

  if (!user.passwordHash || !(await verifyPassword(body.password, user.passwordHash))) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
  }

  await prisma.user.delete({
    where: { id: user.id },
  });
  await clearSession();

  return NextResponse.json({ message: "Account deleted successfully." });
}
