import type { Match } from "@/features/match/api/match";

const PARTICIPATION_CUTOFF_MS = 24 * 60 * 60 * 1000;

export function canUpdateMatchParticipation(
  match: Pick<Match, "matchAt" | "status">
) {
  const cutoffAt = new Date(match.matchAt).getTime() - PARTICIPATION_CUTOFF_MS;

  return match.status === "SCHEDULED" && Date.now() < cutoffAt;
}
