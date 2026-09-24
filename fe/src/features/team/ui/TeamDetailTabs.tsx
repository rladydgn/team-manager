import Link from "next/link";

type TeamDetailTabsProps = {
  teamId: number;
  activeTab: "overview" | "matches" | "members" | "statistics" | "rankings" | "feePayments";
  canAccessTeamFeatures?: boolean;
  canManageFees?: boolean;
};

export function TeamDetailTabs({ teamId, activeTab, canAccessTeamFeatures = false, canManageFees = false }: TeamDetailTabsProps) {
  const tabs = [
    { key: "overview", path: "", label: "팀 홈", visible: true },
    { key: "matches", path: "/match", label: "경기 일정", visible: canAccessTeamFeatures },
    { key: "members", path: "/member", label: "팀원", visible: canAccessTeamFeatures },
    { key: "statistics", path: "/statistics", label: "통계", visible: canAccessTeamFeatures },
    { key: "rankings", path: "/ranking", label: "순위", visible: canAccessTeamFeatures },
    { key: "feePayments", path: "/fee-payment", label: "회비 납부", visible: canAccessTeamFeatures && canManageFees },
  ];

  return (
    <nav aria-label="팀 상세 메뉴" className="overflow-x-auto border-b border-[#dbe4f0]">
      <div className="flex min-w-max items-center gap-1">
        {tabs.filter((tab) => tab.visible).map((tab) => (
          <Link key={tab.key} href={`/team/${teamId}${tab.path}`}
            aria-current={activeTab === tab.key ? "page" : undefined}
            className={`inline-flex h-11 items-center justify-center border-b-2 px-4 text-sm font-semibold transition-colors ${activeTab === tab.key
              ? "border-[#4f6f9f] text-[#2f4d76]"
              : "border-transparent text-[#64748b] hover:border-[#c8d4e6] hover:text-[#3d5b86]"}`}>
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
