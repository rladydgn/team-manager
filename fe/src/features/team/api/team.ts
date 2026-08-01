import { deleteJson, getJson, postJson, putJson } from "@/shared/api/http";

export type Team = {
  id: number;
  createdByUserId: number;
  category: "SOCCER" | "BASKETBALL";
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  description: string | null;
  region: string | null;
  homeStadium: string | null;
  foundedAt: string | null;
  teamColor: string | null;
  status: "ACTIVE" | "INACTIVE";
  membershipStatus: "ACTIVE" | "PENDING" | "REJECTED" | "LEFT" | "BANNED" | null;
  createdAt: string;
  updatedAt: string;
};

export type TeamCreateRequest = {
  name: string;
  category?: "SOCCER" | "BASKETBALL";
  shortName?: string;
  description?: string;
  region?: string;
  homeStadium?: string;
  foundedAt?: string;
};

export type TeamUpdateRequest = {
  name: string;
  category?: "SOCCER" | "BASKETBALL";
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
  memo: string | null;
  role: "OWNER" | "SUB_MANAGER" | "MEMBER" | "GUEST";
  status: "ACTIVE" | "PENDING" | "REJECTED" | "LEFT" | "BANNED";
  joinedAt: string | null;
  requestedAt: string;
};

export type TeamMemberCreateRequest = {
  displayName: string;
  role: "MEMBER" | "GUEST";
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

export function getTeamMembers(teamId: number) {
  return getJson<TeamMember[]>(`/teams/${teamId}/members`);
}

export function createTeam(request: TeamCreateRequest) {
  return postJson<Team, TeamCreateRequest>("/teams", request);
}

export function joinTeam(teamId: number) {
  return postJson<TeamMember>(`/teams/${teamId}/members`);
}

export function addTeamMember(teamId: number, request: TeamMemberCreateRequest) {
  return postJson<TeamMember, TeamMemberCreateRequest>(
    `/teams/${teamId}/members/manual`,
    request
  );
}

export function updateTeamMemberMemo(teamId: number, teamMemberId: number, memo: string) {
  return putJson<TeamMember, { memo: string }>(`/teams/${teamId}/members/${teamMemberId}/memo`, { memo });
}

export function deleteTeamMemberMemo(teamId: number, teamMemberId: number) {
  return deleteJson<TeamMember>(`/teams/${teamId}/members/${teamMemberId}/memo`);
}

export function getTeamJoinRequests(teamId: number) {
  return getJson<TeamMember[]>(`/teams/${teamId}/join-requests`);
}

export function approveTeamJoinRequest(teamId: number, teamMemberId: number) {
  return postJson<TeamMember>(
    `/teams/${teamId}/join-requests/${teamMemberId}/approve`
  );
}

export function rejectTeamJoinRequest(teamId: number, teamMemberId: number) {
  return postJson<TeamMember>(
    `/teams/${teamId}/join-requests/${teamMemberId}/reject`
  );
}

export function updateTeam(teamId: number, request: TeamUpdateRequest) {
  return putJson<Team, TeamUpdateRequest>(`/teams/${teamId}`, request);
}

export function deleteTeam(teamId: number) {
  return deleteJson<null>(`/teams/${teamId}`);
}
