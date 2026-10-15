import {
  USAGE_LIMIT_TONES,
  USAGE_NUMBER_FORMATTER,
  USAGE_RESET_FORMATTER,
} from "@/constants/usage-limits";
import type { AiCreditUsage } from "@/types/ai";

export function getMonthlyUsageLimit(usage: AiCreditUsage) {
  const usedCredits = Math.max(0, Math.round(usage.monthlyUsedCredits));
  const availableCredits = Math.max(0, Math.round(usage.availableCredits));
  const totalCredits = usedCredits + availableCredits;
  const remainingPercent = totalCredits === 0
    ? 0
    : Math.round((availableCredits / totalCredits) * 100);
  const tone = USAGE_LIMIT_TONES.find(
    candidate => remainingPercent >= candidate.minimumPercent,
  ) ?? USAGE_LIMIT_TONES[USAGE_LIMIT_TONES.length - 1];

  return {
    usedCredits,
    availableCredits,
    totalCredits,
    remainingPercent,
    tone,
    resetLabel: USAGE_RESET_FORMATTER.format(new Date(usage.monthlyResetAt)),
  };
}

export function formatUsageCredits(credits: number) {
  return USAGE_NUMBER_FORMATTER.format(credits);
}
