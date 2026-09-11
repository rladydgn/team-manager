import { getJson, postJson, putJson } from "@/shared/api/http";

export type TeamSeason = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
};

export type TeamSeasonCreateRequest = {
  name: string;
  startDate: string;
  endDate: string;
};

export function getTeamSeasons(teamId: number) {
  return getJson<TeamSeason[]>(`/teams/${teamId}/seasons`);
}

export function createTeamSeason(teamId: number, request: TeamSeasonCreateRequest) {
  return postJson<TeamSeason[], TeamSeasonCreateRequest>(`/teams/${teamId}/seasons`, request);
}

export function setDefaultTeamSeason(teamId: number, seasonId: number) {
  return putJson<TeamSeason[], Record<string, never>>(
    `/teams/${teamId}/seasons/${seasonId}/default`,
    {}
  );
}

export function reorderTeamSeasons(teamId: number, seasonIds: number[]) {
  return putJson<TeamSeason[], { seasonIds: number[] }>(`/teams/${teamId}/seasons/order`, {
    seasonIds,
  });
}
