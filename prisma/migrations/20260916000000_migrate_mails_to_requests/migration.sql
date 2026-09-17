CREATE TYPE "UserRole" AS ENUM ('USER', 'DEVELOPER');
CREATE TYPE "IssueType" AS ENUM ('BUG', 'FEATURE', 'SUPPORT');
CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "NotificationType" AS ENUM ('ISSUE_CREATED', 'ISSUE_MESSAGE', 'ISSUE_STATUS_CHANGED', 'ISSUE_PRIORITY_CHANGED');

ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

ALTER TABLE "issues" ADD COLUMN "type" "IssueType" NOT NULL DEFAULT 'SUPPORT';
ALTER TABLE "issues" ADD COLUMN "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "issues" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "issues" ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "issues" SET "priority" = CASE "severity"::text
  WHEN 'IMPORTANT' THEN 'HIGH'::"IssuePriority"
  WHEN 'LOW' THEN 'LOW'::"IssuePriority"
  ELSE 'MEDIUM'::"IssuePriority"
END;

ALTER TABLE "issues" DROP COLUMN "severity";
DROP TYPE "IssueSeverity";
ALTER TYPE "IssueStatus" ADD VALUE 'WAITING_FOR_USER';
ALTER TYPE "IssueStatus" ADD VALUE 'CLOSED';

CREATE TABLE "issue_messages" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "issue_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issueId" TEXT,
    "type" "NotificationType" NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "issue_messages_issueId_createdAt_idx" ON "issue_messages"("issueId", "createdAt");
CREATE INDEX "issue_messages_authorId_createdAt_idx" ON "issue_messages"("authorId", "createdAt");
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");
CREATE INDEX "notifications_issueId_createdAt_idx" ON "notifications"("issueId", "createdAt");

ALTER TABLE "issue_messages" ADD CONSTRAINT "issue_messages_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issue_messages" ADD CONSTRAINT "issue_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "mail_review_preferences";
DROP TABLE IF EXISTS "mail_importance_reviews";
DROP TABLE IF EXISTS "gmail_connections";
DROP TABLE IF EXISTS "mails";
DROP TYPE IF EXISTS "MailImportance";
DROP TYPE IF EXISTS "MailDirection";
DROP TYPE IF EXISTS "MailStatus";
