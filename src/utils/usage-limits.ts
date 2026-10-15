import {
  USAGE_BAR_DEFAULT_CLASS,
  USAGE_BAR_THRESHOLDS,
  USAGE_RESET_FORMATTER,
} from "@/constants/usage-limits";
import type { AiCreditUsageWindow } from "@/types/ai";

export function getUsageWindowAvailablePercent(window: AiCreditUsageWindow) {
  if (window.limitCredits <= 0) return 0;

  const availableCredits = Math.max(0, window.limitCredits - window.usedCredits);
  return Math.round((availableCredits / window.limitCredits) * 100);
}

export function formatUsageReset(resetAt: string | null) {
  return resetAt ? `Resets ${USAGE_RESET_FORMATTER.format(new Date(resetAt))}` : null;
}

export function formatTimeUntil(isoDate: string) {
  const totalMinutes = Math.max(1, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 60_000));
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getUsageBarClass(availablePercent: number) {
  const threshold = USAGE_BAR_THRESHOLDS.find(
    candidate => availablePercent <= candidate.maximumPercent,
  );

  return threshold?.className ?? USAGE_BAR_DEFAULT_CLASS;
}
