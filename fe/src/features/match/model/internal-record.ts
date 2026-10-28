import type { Match } from "../api/match";
import type { ParticipantSide } from "../api/formations";
import type { PlayerStatistics } from "./record-statistics";

export type InternalUnknownCounts = { homeGoals: number; homeAssists: number; awayGoals: number; awayAssists: number };

export function needsInternalRecordReview(match: Pick<Match, "matchType" | "status" | "teamScore" | "opponentScore" | "internalRecordConfirmed">) {
  return match.matchType === "INTERNAL" && !match.internalRecordConfirmed &&
    (match.status === "COMPLETED" || match.teamScore != null || match.opponentScore != null);
}

export function calculateInternalScores(
  statistics: Record<number, PlayerStatistics>, sides: Record<number, ParticipantSide>, unknown: InternalUnknownCounts,
) {
  let homeGoals = unknown.homeGoals;
  let homeAssists = unknown.homeAssists;
  let awayGoals = unknown.awayGoals;
  let awayAssists = unknown.awayAssists;
  const unassignedRecordIds: number[] = [];
  for (const [id, player] of Object.entries(statistics)) {
    const side = sides[Number(id)] ?? "UNASSIGNED";
    if (side === "HOME") { homeGoals += player.goalCount; homeAssists += player.assistCount; }
    else if (side === "AWAY") { awayGoals += player.goalCount; awayAssists += player.assistCount; }
    else if (player.goalCount > 0 || player.assistCount > 0 || player.cleanSheetCount > 0) unassignedRecordIds.push(Number(id));
  }
  return { homeGoals, homeAssists, awayGoals, awayAssists, unassignedRecordIds,
    invalidAssists: homeAssists > homeGoals || awayAssists > awayGoals };
}
