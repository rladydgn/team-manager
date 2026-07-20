import Link from "next/link";

type TeamDetailTabsProps = {
  teamId: number;
  activeTab: "overview" | "matches" | "members";
};

export function TeamDetailTabs({ teamId, activeTab }: TeamDetailTabsProps) {
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
        <span
          aria-disabled="true"
          title="출석률 기능은 준비 중입니다."
          className="inline-flex h-11 cursor-not-allowed items-center justify-center border-b-2 border-transparent px-4 text-sm font-semibold text-[#a1afc2]"
        >
          출석률
        </span>
      </div>
    </nav>
  );
}
