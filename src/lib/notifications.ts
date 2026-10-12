import type { Prisma } from "@prisma/client";
import { getIssueAccessFilter } from "@/lib/issue-access";

/**
 * Notifications are visible while the recipient owns the linked issue or its
 * project. This also protects older notifications created before issue access
 * was restricted. Notifications without an issue remain recipient-scoped.
 */
export function getAuthorizedNotificationWhere(userId: string): Prisma.NotificationWhereInput {
  return {
    userId,
    OR: [
      { issueId: null },
      { issue: { is: getIssueAccessFilter(userId) } },
    ],
  };
}

export function getNotificationReadWhere(userId: string): Prisma.NotificationWhereInput {
  return {
    ...getAuthorizedNotificationWhere(userId),
    readAt: null,
  };
}
