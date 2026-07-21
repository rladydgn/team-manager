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
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border px-5 text-sm font-bold shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6f9f] disabled:cursor-not-allowed disabled:border-[#dbe4f0] disabled:bg-[#f8fafc] disabled:text-[#94a3b8] sm:w-auto ${
        isParticipating
          ? "border-[#c8d4e6] bg-white text-[#52627b] hover:border-[#aebfd5] hover:bg-[#f8fafc]"
          : "border-[#435f88] bg-[#4f6f9f] text-white shadow-[0_8px_18px_rgba(79,111,159,0.22)] hover:-translate-y-0.5 hover:bg-[#435f88] hover:shadow-[0_10px_22px_rgba(79,111,159,0.28)]"
      }`}
    >
      {isUpdating ? (
        "변경 중..."
      ) : isParticipating ? (
        "참여 취소"
      ) : (
        <>
          <svg
            aria-hidden="true"
            className="size-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 4v12M4 10h12" strokeLinecap="round" />
          </svg>
          참여하기
        </>
      )}
    </button>
  );
}
