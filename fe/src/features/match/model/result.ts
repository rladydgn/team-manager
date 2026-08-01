import type { Match } from "@/features/match/api/match";

export type MatchResult = "WIN" | "DRAW" | "LOSS";

export const matchResultPresentation: Record<
  MatchResult,
  { label: string; className: string }
> = {
  WIN: {
    label: "승",
    className: "border-[#b8d7c1] bg-[#f1f8f2] text-[#36734a]",
  },
  DRAW: {
    label: "무",
    className: "border-[#c8d4e6] bg-[#f0f4fa] text-[#3d5b86]",
  },
  LOSS: {
    label: "패",
    className: "border-[#f3cfcc] bg-[#fff4f3] text-[#a85450]",
  },
};

export function getMatchResult(
  match: Pick<
    Match,
    "matchAt" | "opponentScore" | "status" | "teamScore"
  >
): MatchResult | null {
  if (
    match.status === "CANCELED" ||
    match.teamScore === null ||
    match.opponentScore === null ||
    new Date(match.matchAt).getTime() > Date.now()
  ) {
    return null;
  }

  if (match.teamScore === match.opponentScore) {
    return "DRAW";
  }

  return match.teamScore > match.opponentScore ? "WIN" : "LOSS";
}
