import { getJson, postJson } from "@/shared/api/http";

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
};

export type TeamMember = {
  id: number;
  userId: number | null;
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
