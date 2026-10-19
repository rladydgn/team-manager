import type { FormationInput, FormationPlayer, FormationSide, Placement, PlacementInput } from "../api/formations";

export function placePlayer(placements: PlacementInput[], slotId: string, teamMemberId: number): PlacementInput[] {
  const source = placements.find((placement) => placement.teamMemberId === teamMemberId);
  const target = placements.find((placement) => placement.slotId === slotId);
  if (source?.slotId === slotId) return placements;
  const remaining = placements.filter((placement) => placement.slotId !== slotId && placement.teamMemberId !== teamMemberId);
  if (source && target) remaining.push({ slotId: source.slotId, teamMemberId: target.teamMemberId });
  return [...remaining, { slotId, teamMemberId }];
}

export function getBench(players: FormationPlayer[], placements: Placement[], side: FormationSide) {
  const placed = new Set(placements.filter((placement) => placement.eligible).map((placement) => placement.teamMemberId));
  return players.filter((player) => player.side === side && !placed.has(player.teamMemberId));
}

export function draftPlacements(draft: FormationInput, players: FormationPlayer[], saved: Placement[] = []): Placement[] {
  return draft.placements.map((placement) => {
    const player = players.find((player) => player.teamMemberId === placement.teamMemberId);
    const previous = saved.find((item) => item.teamMemberId === placement.teamMemberId);
    const reason = player ? player.side === "UNASSIGNED" ? "SIDE_UNASSIGNED" : player.side !== draft.side ? "SIDE_MISMATCH" : null
      : previous?.ineligibleReason ?? "NOT_ATTENDING";
    return { ...placement, name: player?.name ?? previous?.name ?? "삭제된 선수", eligible: reason === null, ineligibleReason: reason,
      mainPosition: (player ?? previous)?.mainPosition ?? null, jerseyNumber: (player ?? previous)?.jerseyNumber ?? null };
  });
}

export function titleError(title: string) {
  return !title.trim() || title.trim().length > 50 || /[\r\n\u2028\u2029]/.test(title)
    ? "제목은 줄바꿈 없이 1~50자로 입력해 주세요." : "";
}

export const ineligibleLabels = {
  NOT_ATTENDING: "참석 투표 변경", PARTICIPANT_REMOVED: "참가 명단에서 제거됨", MEMBER_REMOVED: "삭제된 선수",
  SIDE_UNASSIGNED: "편 미배정", SIDE_MISMATCH: "다른 편으로 변경",
} as const;
