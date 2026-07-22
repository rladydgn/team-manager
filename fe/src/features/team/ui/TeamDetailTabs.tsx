import Link from "next/link";

type TeamDetailTabsProps = {
  teamId: number;
  activeTab: "overview" | "matches" | "members" | "statistics" | "feePayments";
  canManageFees?: boolean;
};

export function TeamDetailTabs({
  teamId,
  activeTab,
  canManageFees = false,
}: TeamDetailTabsProps) {
  const overviewClassName =
    activeTab === "overview"
      ? "border-b-2 border-[#4f6f9f] text-[#2f4d76]"
      : "border-b-2 border-transparent text-[#64748b] hover:border-[#c8d4e6] hover:text-[#3d5b86]";
  const matchesClassName =
    activeTab === "matches"
      ? "border-b-2 border-[#4f6f9f] text-[#2f4d76]"
      : "border-b-2 border-transparent text-[#64748b] hover:border-[#c8d4e6] hover:text-[#3d5b86]";
  const membersClassName =
    activeTab === "members"
      ? "border-b-2 border-[#4f6f9f] text-[#2f4d76]"
      : "border-b-2 border-transparent text-[#64748b] hover:border-[#c8d4e6] hover:text-[#3d5b86]";
  const statisticsClassName =
    activeTab === "statistics"
      ? "border-b-2 border-[#4f6f9f] text-[#2f4d76]"
      : "border-b-2 border-transparent text-[#64748b] hover:border-[#c8d4e6] hover:text-[#3d5b86]";
  const feePaymentsClassName =
    activeTab === "feePayments"
      ? "border-b-2 border-[#4f6f9f] text-[#2f4d76]"
      : "border-b-2 border-transparent text-[#64748b] hover:border-[#c8d4e6] hover:text-[#3d5b86]";

  return (
    <nav
      aria-label="팀 상세 메뉴"
      className="overflow-x-auto border-b border-[#dbe4f0]"
    >
      <div className="flex min-w-max items-center gap-1">
        <Link
          href={`/teams/${teamId}`}
          aria-current={activeTab === "overview" ? "page" : undefined}
          className={`inline-flex h-11 items-center justify-center px-4 text-sm font-semibold transition-colors ${overviewClassName}`}
        >
          메인
        </Link>
        <Link
          href={`/teams/${teamId}/matches`}
          aria-current={activeTab === "matches" ? "page" : undefined}
          className={`inline-flex h-11 items-center justify-center px-4 text-sm font-semibold transition-colors ${matchesClassName}`}
        >
          경기 일정
        </Link>
        <Link
          href={`/teams/${teamId}/members`}
          aria-current={activeTab === "members" ? "page" : undefined}
          className={`inline-flex h-11 items-center justify-center px-4 text-sm font-semibold transition-colors ${membersClassName}`}
        >
          팀원
        </Link>
        <Link
          href={`/teams/${teamId}/statistics`}
          aria-current={activeTab === "statistics" ? "page" : undefined}
          className={`inline-flex h-11 items-center justify-center px-4 text-sm font-semibold transition-colors ${statisticsClassName}`}
        >
          통계
        </Link>
        {canManageFees ? (
          <Link
            href={`/teams/${teamId}/fee-payments`}
            aria-current={activeTab === "feePayments" ? "page" : undefined}
            className={`inline-flex h-11 items-center justify-center px-4 text-sm font-semibold transition-colors ${feePaymentsClassName}`}
          >
            회비 납부
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
