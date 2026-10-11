import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getIssueAccessFilter, getIssueRecipientIds } from "@/lib/issue-access";
import { badRequest, notFound, parseBody, requiredString } from "@/lib/workspace-api";
import prisma from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const issueId = (await context.params).id;
  const body = await parseBody(request);
  if (!body) return badRequest("Invalid JSON body.");
  const text = requiredString(body.body, "body");
  if (text.error) return text.error;

  const message = await prisma.$transaction(async transaction => {
    // The guarded write holds the issue row until the message is committed.
    const result = await transaction.issue.updateMany({
      where: { id: issueId, ...getIssueAccessFilter(user.id) },
      data: { lastActivityAt: new Date() },
    });
    if (!result.count) return null;

    const issue = await transaction.issue.findFirst({
      where: { id: issueId, ...getIssueAccessFilter(user.id) },
      select: { userId: true, project: { select: { userId: true } } },
    });
    if (!issue) return null;

    const created = await transaction.issueMessage.create({
      data: { issueId, authorId: user.id, body: text.value },
    });
    const recipientIds = getIssueRecipientIds(issue, user.id);
    if (recipientIds.length) {
      await transaction.notification.createMany({
        data: recipientIds.map(userId => ({ userId, issueId, type: "ISSUE_MESSAGE" as const })),
      });
    }
    return created;
  });
  if (!message) return notFound("Issue not found.");
  return NextResponse.json({
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    },
  }, { status: 201 });
}
