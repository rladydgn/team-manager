import type { Match, MatchParticipant } from "@/features/match/api/match";

const memberNameOrder = new Intl.Collator("ko");

export function sortMembersByParticipation<T extends { id: number; name: string | null; userId: number | null }>(
  members: T[],
  participants: Pick<MatchParticipant, "teamMemberId" | "voteStatus">[],
): T[] {
  const attendingIds = new Set(participants.filter((participant) => participant.voteStatus === "AVAILABLE").map((participant) => participant.teamMemberId));
  const displayName = (member: T) => member.name ?? (member.userId ? "가입 팀원" : "미가입 팀원");
  return [...members].sort((left, right) =>
    Number(attendingIds.has(right.id)) - Number(attendingIds.has(left.id)) ||
    memberNameOrder.compare(displayName(left), displayName(right)) ||
    left.id - right.id,
  );
}

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
