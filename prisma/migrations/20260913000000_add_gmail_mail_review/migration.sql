ALTER TABLE "ai_provider_connections" ADD COLUMN "model" TEXT;

CREATE TYPE "MailImportance" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TABLE "gmail_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "gmail_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mail_importance_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "importance" "MailImportance" NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mail_importance_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mail_review_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mail_review_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gmail_connections_userId_key" ON "gmail_connections"("userId");
CREATE UNIQUE INDEX "mail_importance_reviews_userId_gmailMessageId_key" ON "mail_importance_reviews"("userId", "gmailMessageId");
CREATE INDEX "mail_importance_reviews_userId_reviewedAt_idx" ON "mail_importance_reviews"("userId", "reviewedAt");
CREATE UNIQUE INDEX "mail_review_preferences_userId_key" ON "mail_review_preferences"("userId");

ALTER TABLE "gmail_connections" ADD CONSTRAINT "gmail_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mail_importance_reviews" ADD CONSTRAINT "mail_importance_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mail_review_preferences" ADD CONSTRAINT "mail_review_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
