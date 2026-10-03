CREATE TYPE "AiCreditEntryType" AS ENUM (
  'INITIAL_GRANT',
  'MONTHLY_GRANT',
  'RESERVATION',
  'SPEND',
  'RELEASE'
);

CREATE TYPE "AgentPermissionMode" AS ENUM (
  'ASK',
  'PLAN',
  'USER_APPROVE',
  'AUTO_APPROVE'
);

CREATE TYPE "AgentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');
ALTER TYPE "AgentRunStatus" ADD VALUE 'WAITING_FOR_APPROVAL';
ALTER TYPE "AgentRunEventType" ADD VALUE 'APPROVAL';

CREATE TABLE "ai_credit_wallets" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "reservedCredits" INTEGER NOT NULL DEFAULT 0,
  "monthlyAllowance" INTEGER NOT NULL DEFAULT 300,
  "lastMonthlyGrantAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ai_credit_wallets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_credit_wallets_nonnegative_balance_check" CHECK ("balance" >= 0),
  CONSTRAINT "ai_credit_wallets_nonnegative_reserved_check" CHECK ("reservedCredits" >= 0),
  CONSTRAINT "ai_credit_wallets_reserved_within_balance_check" CHECK ("reservedCredits" <= "balance")
);

CREATE TABLE "ai_credit_ledger_entries" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "type" "AiCreditEntryType" NOT NULL,
  "deltaCredits" INTEGER NOT NULL,
  "amountUsd" DECIMAL(18,9),
  "idempotencyKey" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_credit_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_credit_wallets_userId_key" ON "ai_credit_wallets"("userId");
CREATE UNIQUE INDEX "ai_credit_ledger_entries_idempotencyKey_key" ON "ai_credit_ledger_entries"("idempotencyKey");
CREATE INDEX "ai_credit_ledger_entries_userId_createdAt_idx" ON "ai_credit_ledger_entries"("userId", "createdAt");
CREATE INDEX "ai_credit_ledger_entries_walletId_createdAt_idx" ON "ai_credit_ledger_entries"("walletId", "createdAt");

ALTER TABLE "ai_credit_wallets"
  ADD CONSTRAINT "ai_credit_wallets_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_credit_ledger_entries"
  ADD CONSTRAINT "ai_credit_ledger_entries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ai_credit_ledger_entries_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "ai_credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agent_runs"
  ADD COLUMN "permissionMode" "AgentPermissionMode" NOT NULL DEFAULT 'ASK',
  ADD COLUMN "creditReservation" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "changePatch" TEXT;

CREATE TABLE "agent_run_approvals" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "status" "AgentApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  CONSTRAINT "agent_run_approvals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_run_approvals_runId_status_createdAt_idx" ON "agent_run_approvals"("runId", "status", "createdAt");
CREATE INDEX "agent_run_approvals_userId_status_createdAt_idx" ON "agent_run_approvals"("userId", "status", "createdAt");
ALTER TABLE "agent_run_approvals"
  ADD CONSTRAINT "agent_run_approvals_runId_fkey" FOREIGN KEY ("runId") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "agent_run_approvals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH new_wallets AS (
  INSERT INTO "ai_credit_wallets" ("id", "userId", "balance", "monthlyAllowance", "lastMonthlyGrantAt", "updatedAt")
  SELECT 'credit_wallet_' || md5(users."id" || clock_timestamp()::text), users."id", 300, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM "users" AS users
  ON CONFLICT ("userId") DO NOTHING
  RETURNING "id", "userId"
)
INSERT INTO "ai_credit_ledger_entries" ("id", "userId", "walletId", "type", "deltaCredits", "idempotencyKey")
SELECT 'credit_entry_' || md5(new_wallets."userId" || ':initial'), new_wallets."userId", new_wallets."id", 'INITIAL_GRANT', 300, 'initial:' || new_wallets."userId"
FROM new_wallets;
