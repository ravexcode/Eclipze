import "server-only";

import { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

export const INITIAL_AI_CREDITS = 300;
export const DEFAULT_MONTHLY_AI_CREDITS = 300;
export const AI_CREDITS_PER_USD = 1_000;

function monthStartAfter(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

async function ensureWalletInTransaction(transaction: Prisma.TransactionClient, userId: string) {
  let wallet = await transaction.aiCreditWallet.findUnique({ where: { userId } });

  if (!wallet) {
    wallet = await transaction.aiCreditWallet.create({
      data: {
        userId,
        balance: INITIAL_AI_CREDITS,
        monthlyAllowance: DEFAULT_MONTHLY_AI_CREDITS,
        lastMonthlyGrantAt: new Date(),
      },
    });
    await transaction.aiCreditLedgerEntry.create({
      data: {
        userId,
        walletId: wallet.id,
        type: "INITIAL_GRANT",
        deltaCredits: INITIAL_AI_CREDITS,
        idempotencyKey: `initial:${userId}`,
      },
    });
  }

  let lastGrant = wallet.lastMonthlyGrantAt ?? wallet.createdAt;
  let nextGrant = monthStartAfter(lastGrant);
  const now = new Date();

  while (nextGrant <= now) {
    const month = `${nextGrant.getUTCFullYear()}-${String(nextGrant.getUTCMonth() + 1).padStart(2, "0")}`;
    const idempotencyKey = `monthly:${userId}:${month}`;
    const grantCredits = wallet.monthlyAllowance;

    await transaction.aiCreditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { increment: grantCredits },
        lastMonthlyGrantAt: nextGrant,
      },
    });
    await transaction.aiCreditLedgerEntry.create({
      data: {
        userId,
        walletId: wallet.id,
        type: "MONTHLY_GRANT",
        deltaCredits: grantCredits,
        idempotencyKey,
        metadata: { grantMonth: month },
      },
    });

    lastGrant = nextGrant;
    nextGrant = monthStartAfter(lastGrant);
  }

  if (lastGrant.getTime() !== wallet.lastMonthlyGrantAt?.getTime()) {
    wallet = await transaction.aiCreditWallet.findUniqueOrThrow({ where: { id: wallet.id } });
  }

  return wallet;
}

export async function ensureAiCreditWallet(userId: string) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await prisma.$transaction(
        transaction => ensureWalletInTransaction(transaction, userId),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      const isRetryable = error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034");
      if (!isRetryable || attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }

  throw new Error("Unable to update the AI credit balance.");
}

export async function createInitialAiCreditGrant(transaction: Prisma.TransactionClient, userId: string) {
  const wallet = await transaction.aiCreditWallet.create({
    data: {
      userId,
      balance: INITIAL_AI_CREDITS,
      monthlyAllowance: DEFAULT_MONTHLY_AI_CREDITS,
      lastMonthlyGrantAt: new Date(),
    },
  });

  await transaction.aiCreditLedgerEntry.create({
    data: {
      userId,
      walletId: wallet.id,
      type: "INITIAL_GRANT",
      deltaCredits: INITIAL_AI_CREDITS,
      idempotencyKey: `initial:${userId}`,
    },
  });

  return wallet;
}

export function usdToAiCredits(costUsd: number) {
  if (!Number.isFinite(costUsd) || costUsd < 0) {
    throw new Error("The AI provider returned an invalid usage cost.");
  }

  return Math.ceil(costUsd * AI_CREDITS_PER_USD);
}

export async function reserveAiCredits(input: {
  userId: string;
  runId: string;
  credits: number;
}) {
  if (!Number.isInteger(input.credits) || input.credits < 1) {
    throw new Error("A positive AI credit reservation is required.");
  }

  await ensureAiCreditWallet(input.userId);

  return prisma.$transaction(async transaction => {
    const updated = await transaction.$executeRaw`
      UPDATE "ai_credit_wallets"
      SET "reservedCredits" = "reservedCredits" + ${input.credits}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = ${input.userId}
        AND "balance" - "reservedCredits" >= ${input.credits}
    `;

    if (updated !== 1) {
      return false;
    }

    const wallet = await transaction.aiCreditWallet.findUniqueOrThrow({ where: { userId: input.userId } });
    await transaction.aiCreditLedgerEntry.create({
      data: {
        userId: input.userId,
        walletId: wallet.id,
        type: "RESERVATION",
        deltaCredits: 0,
        idempotencyKey: `reservation:${input.runId}`,
        metadata: { reservedCredits: input.credits, runId: input.runId },
      },
    });

    return true;
  });
}

export async function settleAiCreditReservation(input: {
  userId: string;
  runId: string;
  reservedCredits: number;
  costUsd: number;
}) {
  const spentCredits = usdToAiCredits(input.costUsd);

  await prisma.$transaction(async transaction => {
    const wallet = await transaction.aiCreditWallet.findUnique({ where: { userId: input.userId } });
    if (!wallet) throw new Error("AI credit wallet is unavailable.");

    const additionalCredits = Math.max(0, spentCredits - input.reservedCredits);
    const updated = await transaction.$executeRaw`
      UPDATE "ai_credit_wallets"
      SET "balance" = "balance" - ${spentCredits},
          "reservedCredits" = "reservedCredits" - ${input.reservedCredits},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = ${input.userId}
        AND "reservedCredits" >= ${input.reservedCredits}
        AND "balance" >= ${spentCredits}
        AND ("balance" - "reservedCredits") >= ${additionalCredits}
    `;

    if (updated !== 1) {
      throw new Error("The AI credit balance changed before usage could be settled.");
    }

    await transaction.aiCreditLedgerEntry.create({
      data: {
        userId: input.userId,
        walletId: wallet.id,
        type: "SPEND",
        deltaCredits: -spentCredits,
        amountUsd: new Prisma.Decimal(input.costUsd.toFixed(9)),
        idempotencyKey: `spend:${input.runId}`,
        metadata: { runId: input.runId, reservedCredits: input.reservedCredits },
      },
    });

    await transaction.aiCreditLedgerEntry.create({
      data: {
        userId: input.userId,
        walletId: wallet.id,
        type: "RELEASE",
        deltaCredits: 0,
        idempotencyKey: `release:${input.runId}`,
        metadata: {
          runId: input.runId,
          releasedCredits: Math.max(0, input.reservedCredits - spentCredits),
          additionalCreditsCharged: Math.max(0, spentCredits - input.reservedCredits),
        },
      },
    });
  });

  return spentCredits;
}

export async function releaseAiCreditReservation(input: {
  userId: string;
  runId: string;
  reservedCredits: number;
}) {
  await prisma.$transaction(async transaction => {
    const wallet = await transaction.aiCreditWallet.findUnique({ where: { userId: input.userId } });
    if (!wallet) return;

    const releaseEntry = await transaction.aiCreditLedgerEntry.createMany({
      data: [{
        userId: input.userId,
        walletId: wallet.id,
        type: "RELEASE",
        deltaCredits: 0,
        idempotencyKey: `release:${input.runId}`,
        metadata: { runId: input.runId, releasedCredits: input.reservedCredits },
      }],
      skipDuplicates: true,
    });

    if (releaseEntry.count !== 1) return;

    const released = await transaction.$executeRaw`
      UPDATE "ai_credit_wallets"
      SET "reservedCredits" = GREATEST(0, "reservedCredits" - ${input.reservedCredits}),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = ${input.userId}
    `;

    if (released !== 1) throw new Error("Unable to release the AI credit reservation.");
  });
}
