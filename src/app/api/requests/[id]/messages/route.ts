import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { badRequest, notFound, parseBody, requiredString } from "@/lib/workspace-api";
import prisma from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const issueId = (await context.params).id;
  const issue = await prisma.issue.findFirst({ where: { id: issueId, ...(user.role === "DEVELOPER" ? {} : { userId: user.id }) }, select: { id: true, userId: true } });
  if (!issue) return notFound("Request not found.");

  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const text = requiredString(body.body, "body");
  if (text.error) return text.error;

  const message = await prisma.$transaction(async transaction => {
    const created = await transaction.issueMessage.create({ data: { issueId, authorId: user.id, body: text.value } });
    await transaction.issue.update({ where: { id: issueId }, data: { lastActivityAt: new Date() } });

    const recipientIds = user.role === "DEVELOPER"
      ? [issue.userId]
      : (await transaction.user.findMany({ where: { role: "DEVELOPER", id: { not: user.id } }, select: { id: true } })).map(developer => developer.id);

    if (recipientIds.length) {
      await transaction.notification.createMany({ data: recipientIds.map(userId => ({ userId, issueId, type: "ISSUE_MESSAGE" as const })) });
    }
    return created;
  });

  return NextResponse.json({ message: { ...message, createdAt: message.createdAt.toISOString(), updatedAt: message.updatedAt.toISOString() } }, { status: 201 });
}
