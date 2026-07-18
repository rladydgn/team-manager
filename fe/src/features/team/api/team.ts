import { deleteJson, getJson, postJson, putJson } from "@/shared/api/http";

export type Team = {
  id: number;
  createdByUserId: number;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  description: string | null;
  region: string | null;
  homeStadium: string | null;
  foundedAt: string | null;
  teamColor: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type TeamCreateRequest = {
  name: string;
  shortName?: string;
  description?: string;
  region?: string;
  homeStadium?: string;
  foundedAt?: string;
};

export type TeamUpdateRequest = {
  name: string;
  shortName?: string;
  logoUrl?: string;
  description?: string;
  region?: string;
  homeStadium?: string;
  foundedAt?: string;
  teamColor?: string;
};

export type TeamMember = {
  id: number;
  userId: number | null;
  name: string | null;
  role: "OWNER" | "SUB_MANAGER" | "MEMBER" | "GUEST";
  status: "ACTIVE" | "PENDING" | "LEFT" | "BANNED";
  joinedAt: string | null;
};

export type TeamDetail = {
  team: Team;
  members: TeamMember[];
};

export function getTeams() {
  return getJson<Team[]>("/teams");
}

export function getTeam(teamId: number) {
  return getJson<TeamDetail>(`/teams/${teamId}`);
}

export function createTeam(request: TeamCreateRequest) {
  return postJson<Team, TeamCreateRequest>("/teams", request);
}

export function joinTeam(teamId: number) {
  return postJson<TeamMember>(`/teams/${teamId}/members`);
}

export function updateTeam(teamId: number, request: TeamUpdateRequest) {
  return putJson<Team, TeamUpdateRequest>(`/teams/${teamId}`, request);
}

export function deleteTeam(teamId: number) {
  return deleteJson<null>(`/teams/${teamId}`);
}
