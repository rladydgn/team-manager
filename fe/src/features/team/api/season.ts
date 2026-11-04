import { deleteJson, getJson, postJson, putJson } from "@/shared/api/http";

export type TeamSeason = {
  id: number;
  name: string;
  memo?: string | null;
  startDate: string;
  endDate: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
};

export type TeamSeasonCreateRequest = {
  name: string;
  memo?: string | null;
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

export function updateTeamSeason(teamId: number, seasonId: number, request: TeamSeasonCreateRequest) {
  return putJson<TeamSeason[], TeamSeasonCreateRequest>(`/teams/${teamId}/seasons/${seasonId}`, request);
}

export function deleteTeamSeason(teamId: number, seasonId: number, replacementSeasonId?: number) {
  const query = replacementSeasonId === undefined ? "" : `?replacementSeasonId=${replacementSeasonId}`;
  return deleteJson<TeamSeason[]>(`/teams/${teamId}/seasons/${seasonId}${query}`);
}
