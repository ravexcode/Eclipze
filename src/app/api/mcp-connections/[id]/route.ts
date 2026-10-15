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
  const connection = await prisma.mcpConnection.findFirst({
    where: { id, userId: user.id },
    select: { id: true, name: true },
  });

  if (!connection) return notFound("MCP connection not found.");

  await prisma.$transaction([
    prisma.agent.updateMany({
      where: { userId: user.id, mcpConnectionId: connection.id },
      data: { status: "INACTIVE" },
    }),
    prisma.mcpConnection.delete({ where: { id: connection.id } }),
  ]);

  return NextResponse.json(
    { message: `${connection.name} disconnected successfully.` },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}
