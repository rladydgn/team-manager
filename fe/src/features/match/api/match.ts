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
  participationDeadlineAt: string;
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
  participationDeadlineAt: string;
  location: string | null;
  teamScore: number | null;
  opponentScore: number | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  createdAt: string;
  availableParticipantCount: number;
  isMatchParticipant: boolean;
  myVoteStatus: MatchParticipationStatus;
};

export type MatchParticipant = {
  teamMemberId: number;
  voteStatus: MatchParticipationStatus;
  actualParticipated: boolean;
  goalCount: number;
  assistCount: number;
  cleanSheetCount: number;
  memo: string | null;
  respondedAt: string | null;
};

export type MatchParticipantStatisticsUpdateRequest = {
  teamMemberId: number;
  actualParticipated: boolean;
  goalCount: number;
  assistCount: number;
  cleanSheetCount: number;
};

export type MatchRecordUpdateRequest = {
  opponentScore: number;
  participants: MatchParticipantStatisticsUpdateRequest[];
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
  voteStatus: Extract<MatchParticipationStatus, "AVAILABLE" | "UNAVAILABLE">,
  memo?: string
) {
  return putJson<MatchParticipant, { voteStatus: typeof voteStatus; memo?: string }>(
    `/matches/${matchId}/participation`,
    { voteStatus, ...(memo === undefined ? {} : { memo }) }
  );
}

export function updateMatchRecord(
  matchId: number,
  request: MatchRecordUpdateRequest
) {
  return putJson<Match, MatchRecordUpdateRequest>(
    `/matches/${matchId}/record`,
    request
  );
}
