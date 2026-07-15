import { getJson, postJson } from "@/shared/api/http";

export type MatchType = "EXTERNAL" | "INTERNAL";

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
