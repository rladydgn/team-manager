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
    <nav aria-label="팀 상세 메뉴" className="rounded-xl border border-line bg-white p-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {tabs.filter((tab) => tab.visible).map((tab) => (
          <Link key={tab.key} href={`/team/${teamId}${tab.path}`}
            aria-current={activeTab === tab.key ? "page" : undefined}
            className={`inline-flex min-h-10 flex-[1_0_28%] items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors sm:flex-none sm:px-4 ${activeTab === tab.key
              ? "bg-brand-soft text-brand-ink"
              : "text-muted hover:bg-subtle hover:text-ink"}`}>
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
