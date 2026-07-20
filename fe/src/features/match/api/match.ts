import { getJson, postJson, putJson } from "@/shared/api/http";

export type MatchType = "EXTERNAL" | "INTERNAL";
export type MatchParticipationStatus =
  | "INVITED"
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "PENDING";

export type MatchCreateRequest = {
  teamId: number;
  matchType: MatchType;
  opponentTeamName?: string;
  matchAt: string;
  location?: string;
};

export type Match = {
  id: number;
  teamId: number;
  matchType: MatchType;
  opponentTeamId: number | null;
  opponentTeamName: string | null;
  createdByUserId: number;
  matchAt: string;
  location: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  createdAt: string;
  availableParticipantCount: number;
  myParticipationStatus: MatchParticipationStatus;
};

export type MatchParticipant = {
  teamMemberId: number;
  status: MatchParticipationStatus;
  memo: string | null;
  respondedAt: string | null;
};

export function createMatch(request: MatchCreateRequest) {
  return postJson<Match, MatchCreateRequest>("/matches", request);
}

export function getMatch(matchId: number) {
  return getJson<Match>(`/matches/${matchId}`);
}

export function getTeamMatches(teamId: number) {
  return getJson<Match[]>(`/teams/${teamId}/matches`);
}

export function getMatchParticipants(matchId: number) {
  return getJson<MatchParticipant[]>(`/matches/${matchId}/participants`);
}

export function updateMatchParticipation(
  matchId: number,
  status: Extract<MatchParticipationStatus, "AVAILABLE" | "UNAVAILABLE">,
  memo?: string
) {
  return putJson<MatchParticipant, { status: typeof status; memo?: string }>(
    `/matches/${matchId}/participation`,
    { status, ...(memo === undefined ? {} : { memo }) }
  );
}
