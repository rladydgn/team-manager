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

export function canProxyUpdateParticipation(
  match: Pick<Match, "matchAt" | "status" | "teamScore" | "opponentScore">,
  now = Date.now(),
) {
  return match.status === "SCHEDULED" && new Date(match.matchAt).getTime() > now &&
    match.teamScore == null && match.opponentScore == null;
}

export function participationSourceLabel(participant?: Pick<MatchParticipant, "participationSource" | "voteStatus">) {
  if (participant?.participationSource === "SELF") return "본인 응답";
  if (participant?.participationSource === "PROXY") return "대리 등록";
  return participant && ["AVAILABLE", "UNAVAILABLE"].includes(participant.voteStatus) ? "기존 기록" : "";
}
