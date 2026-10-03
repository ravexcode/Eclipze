CREATE TABLE "mails" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mails_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mails_recipientId_sentAt_idx" ON "mails"("recipientId", "sentAt");
CREATE INDEX "mails_senderId_sentAt_idx" ON "mails"("senderId", "sentAt");

ALTER TABLE "mails" ADD CONSTRAINT "mails_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mails" ADD CONSTRAINT "mails_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
