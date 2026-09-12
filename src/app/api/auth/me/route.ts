import { NextResponse } from "next/server";

import { getCurrentUser, serializeUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isValidAvatarUrl, normalizeAvatarUrl } from "@/utils/avatar-url";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  return NextResponse.json({
    user: serializeUser(user),
  }, { headers: PRIVATE_NO_STORE_HEADERS });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => null) as {
    avatarUrl?: string;
  } | null;

  const avatarUrl = normalizeAvatarUrl(body?.avatarUrl ?? "");

  if (avatarUrl && !isValidAvatarUrl(avatarUrl)) {
    return NextResponse.json({ message: "Please enter a valid image URL." }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      avatarUrl: avatarUrl || null,
    },
  });

  return NextResponse.json({
    message: "Profile updated successfully.",
    user: serializeUser(updatedUser),
  });
}
