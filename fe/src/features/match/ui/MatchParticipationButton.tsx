import type { MatchParticipationStatus } from "@/features/match/api/match";

type MatchParticipationButtonProps = {
  status: MatchParticipationStatus;
  isUpdating: boolean;
  onClick: () => void;
};

export function MatchParticipationButton({
  status,
  isUpdating,
  onClick,
}: MatchParticipationButtonProps) {
  const isParticipating = status === "AVAILABLE";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isUpdating}
      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-md border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:border-[#dbe4f0] disabled:bg-[#f8fafc] disabled:text-[#94a3b8] ${
        isParticipating
          ? "border-[#c8d4e6] bg-white text-[#52627b] hover:bg-[#f8fafc]"
          : "border-[#c8d4e6] bg-[#edf3fa] text-[#3d5b86] hover:bg-[#e3ecf7]"
      }`}
    >
      {isUpdating ? "변경 중..." : isParticipating ? "참여 취소" : "참여하기"}
    </button>
  );
}
