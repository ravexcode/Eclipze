import type { Prisma } from "@prisma/client";

export function getIssueAccessFilter(userId: string): Prisma.IssueWhereInput {
  return {
    OR: [
      { userId },
      { project: { is: { userId } } },
    ],
  };
}

export function getIssueRecipientIds(
  issue: { userId: string; project: { userId: string } | null },
  actorId: string,
) {
  return [...new Set([issue.userId, issue.project?.userId])].filter(
    (userId): userId is string => Boolean(userId) && userId !== actorId,
  );
}
