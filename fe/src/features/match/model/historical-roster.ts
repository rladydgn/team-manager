import type { MatchParticipant, MatchParticipationStatus } from "../api/match";
import type { TeamMember } from "../../team/api/team";

export type HistoricalRosterMember = {
  id: number;
  name: string;
  role: TeamMember["role"] | null;
  isActive: boolean;
  originalVoteStatus?: MatchParticipationStatus;
};

export function buildHistoricalRoster(
  activeMembers: TeamMember[],
  existingParticipants: MatchParticipant[]
): HistoricalRosterMember[] {
  const activeById = new Map(activeMembers.map((member) => [member.id, member]));
  const existingIds = new Set(existingParticipants.map((participant) => participant.teamMemberId));

  return [
    ...existingParticipants.map((participant) => ({
      id: participant.teamMemberId,
      name: participant.name ?? activeById.get(participant.teamMemberId)?.name ?? "기존 참가자",
      role: participant.role,
      isActive: activeById.has(participant.teamMemberId),
      originalVoteStatus: participant.voteStatus,
    })),
    ...activeMembers.filter((member) => !existingIds.has(member.id)).map((member) => ({
      id: member.id,
      name: member.name ?? (member.userId ? "가입 팀원" : "미가입 팀원"),
      role: member.role,
      isActive: true,
    })),
  ];
}

export function selectHistoricalMembers(
  members: HistoricalRosterMember[],
  current: Record<number, MatchParticipationStatus> = {}
): Record<number, MatchParticipationStatus> {
  return Object.fromEntries(members.map((member) => [
    member.id,
    current[member.id] ?? member.originalVoteStatus ?? "AVAILABLE",
  ]));
}
