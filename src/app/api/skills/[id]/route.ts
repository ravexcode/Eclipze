import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notFound } from "@/lib/workspace-api";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const { id } = await context.params;
  const result = await prisma.userSkill.deleteMany({ where: { id, userId: user.id } });

  if (result.count === 0) return notFound("Skill not found.");
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
}
