import { deleteJson, getJson, patchJson, postJson, putJson } from "@/shared/api/http";
import type { Match } from "./match";
import type { PlayerProfile } from "@/features/team/api/team";

export type FormationSide = "HOME" | "AWAY";
export type ParticipantSide = FormationSide | "UNASSIGNED";
export type FormationPlayer = PlayerProfile & { teamMemberId: number; name: string; side: ParticipantSide };
export type FormationSlot = { id: string; label: string; x: number; y: number };
export type FormationTemplate = { id: string; label: string; slots: FormationSlot[] };
export type PlacementInput = { slotId: string; teamMemberId: number };
export type Placement = PlacementInput & PlayerProfile & {
  name: string; eligible: boolean;
  ineligibleReason: "NOT_ATTENDING" | "PARTICIPANT_REMOVED" | "MEMBER_REMOVED" | "SIDE_UNASSIGNED" | "SIDE_MISMATCH" | null;
};
export type FormationInput = { title: string; side: FormationSide; templateId: string; placements: PlacementInput[]; version?: number };
export type Formation = Omit<FormationInput, "placements" | "version"> & {
  id: number; matchId: number; version: number; placements: Placement[]; createdAt: string; updatedAt: string;
};
export type FormationCollection = {
  matchId: number; matchType: Match["matchType"]; matchStatus: Match["status"]; maxFormations: number;
  permissions: { canCreate: boolean; canUpdate: boolean; canDelete: boolean; canAssignSides: boolean };
  templates: FormationTemplate[]; attendingPlayers: FormationPlayer[]; formations: Formation[];
};
export type ParticipantSides = { matchId: number; version: number; canManage: boolean; players: FormationPlayer[] };
export const sideLabels = { HOME: "홈", AWAY: "어웨이", UNASSIGNED: "미배정" } as const;
export const getFormations = (matchId: number) => getJson<FormationCollection>(`/matches/${matchId}/formations`, { cache: "no-store" });
export const createFormation = (matchId: number, input: FormationInput) => postJson<Formation, FormationInput>(`/matches/${matchId}/formations`, input);
export const updateFormation = (matchId: number, id: number, input: FormationInput) => putJson<Formation, FormationInput>(`/matches/${matchId}/formations/${id}`, input);
export const deleteFormation = (matchId: number, id: number, version: number) => deleteJson<{ id: number }>(`/matches/${matchId}/formations/${id}?version=${version}`);
export const getParticipantSides = (matchId: number) => getJson<ParticipantSides>(`/matches/${matchId}/participant-sides`, { cache: "no-store" });
export const updateParticipantSides = (matchId: number, version: number, assignments: { teamMemberId: number; side: ParticipantSide }[]) =>
  patchJson<ParticipantSides, { version: number; assignments: typeof assignments }>(`/matches/${matchId}/participant-sides`, { version, assignments });
