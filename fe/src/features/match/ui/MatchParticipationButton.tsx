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
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-line disabled:bg-subtle disabled:text-placeholder sm:w-auto ${
        isParticipating
          ? "border-line-strong bg-white text-secondary hover:border-[#aebfd5] hover:bg-subtle"
          : "border-brand-hover bg-brand text-white shadow-card hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-card"
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
