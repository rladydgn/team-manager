import type { Match } from "@/features/match/api/match";

export function canUpdateMatchParticipation(
  match: Pick<Match, "matchAt" | "participationDeadlineAt" | "status">
) {
  const matchAt = new Date(match.matchAt).getTime();
  const participationDeadlineAt = new Date(
    match.participationDeadlineAt
  ).getTime();
  const now = Date.now();

  return (
    match.status === "SCHEDULED" &&
    Number.isFinite(matchAt) &&
    Number.isFinite(participationDeadlineAt) &&
    now < matchAt &&
    now < participationDeadlineAt
  );
}
