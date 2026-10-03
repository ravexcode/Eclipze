import { NextResponse } from "next/server";

import { ensureAiCreditWallet } from "@/lib/ai-credits";
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

  return NextResponse.json({
    balance: wallet.balance,
    reservedCredits: wallet.reservedCredits,
    availableCredits: Math.max(0, wallet.balance - wallet.reservedCredits),
    monthlyAllowance: wallet.monthlyAllowance,
    serviceOpenRouterAvailable: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    entries: entries.map(entry => ({
      ...entry,
      amountUsd: entry.amountUsd?.toString() ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  }, { headers: PRIVATE_NO_STORE_HEADERS });
}
