import { NextResponse } from "next/server";

import { ensureAiCreditWallet, getAiCreditUsageWindows } from "@/lib/ai-credits";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: PRIVATE_NO_STORE_HEADERS });
  }

  const wallet = await ensureAiCreditWallet(user.id);
  const entries = await prisma.aiCreditLedgerEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      deltaCredits: true,
      amountUsd: true,
      createdAt: true,
    },
  });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthlyResetAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const monthlySpend = await prisma.aiCreditLedgerEntry.aggregate({
    where: {
      userId: user.id,
      type: "SPEND",
      createdAt: { gte: monthStart },
    },
    _sum: { deltaCredits: true },
  });
  const monthlyUsedCredits = Math.abs(monthlySpend._sum.deltaCredits ?? 0) + wallet.reservedCredits;
  const usageWindows = await getAiCreditUsageWindows({
    userId: user.id,
    plan: user.plan,
    reservedCredits: wallet.reservedCredits,
  });

  return NextResponse.json({
    balance: wallet.balance,
    reservedCredits: wallet.reservedCredits,
    availableCredits: Math.max(0, wallet.balance - wallet.reservedCredits),
    monthlyAllowance: user.plan === "FREE" ? 0 : wallet.monthlyAllowance,
    monthlyUsedCredits,
    monthlyResetAt: monthlyResetAt.toISOString(),
    usageWindows,
    serviceOpenRouterAvailable: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    entries: entries.map(entry => ({
      ...entry,
      amountUsd: entry.amountUsd?.toString() ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  }, { headers: PRIVATE_NO_STORE_HEADERS });
}
