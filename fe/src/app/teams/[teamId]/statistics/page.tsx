"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthSession } from "@/features/auth/model/auth-session";
import {
  getTeamAttendanceStatistics,
  TeamAttendanceStatistics,
} from "@/features/team/api/statistics";
import { getTeam, Team } from "@/features/team/api/team";
import { TeamDetailTabs } from "@/features/team/ui/TeamDetailTabs";

type PeriodPreset = "THIS_YEAR" | "SIX_MONTHS" | "ONE_YEAR" | "CUSTOM";

type DateRange = {
  startDate: string;
  endDate: string;
};

const periodPresetLabels: Record<Exclude<PeriodPreset, "CUSTOM">, string> = {
  THIS_YEAR: "올해",
  SIX_MONTHS: "최근 6개월",
  ONE_YEAR: "최근 1년",
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getThisYearRange(): DateRange {
  const now = new Date();
  const year = now.getFullYear();

  return {
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  };
}

function getRecentRange(months: number): DateRange {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - months);

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  };
}

function getPresetRange(preset: Exclude<PeriodPreset, "CUSTOM">): DateRange {
  if (preset === "SIX_MONTHS") {
    return getRecentRange(6);
  }

  if (preset === "ONE_YEAR") {
    return getRecentRange(12);
  }

  return getThisYearRange();
}

function formatRate(value: number) {
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}

export default function TeamStatisticsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const initialRange = getThisYearRange();
  const [team, setTeam] = useState<Team | null>(null);
  const [canManageFees, setCanManageFees] = useState(false);
  const [statistics, setStatistics] = useState<TeamAttendanceStatistics | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>("THIS_YEAR");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [draftStartDate, setDraftStartDate] = useState(initialRange.startDate);
  const [draftEndDate, setDraftEndDate] = useState(initialRange.endDate);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStatistics = useCallback(async () => {
    if (!isSessionReady) {
      return;
    }

    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      setErrorMessage("로그인 후 팀 통계를 확인할 수 있습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [teamResponse, statisticsResponse] = await Promise.all([
        getTeam(teamId),
        getTeamAttendanceStatistics(teamId, startDate, endDate, page),
      ]);
      setTeam(teamResponse.data?.team ?? null);
      setCanManageFees(
        teamResponse.data?.members.some(
          (member) =>
            member.userId === currentUser.id &&
            (member.role === "OWNER" || member.role === "SUB_MANAGER")
        ) ?? false
      );
      setStatistics(statisticsResponse.data ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀 통계를 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, endDate, isSessionReady, page, startDate, teamId]);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadStatistics();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isSessionReady, loadStatistics]);

  function selectPreset(preset: Exclude<PeriodPreset, "CUSTOM">) {
    const range = getPresetRange(preset);
    setSelectedPreset(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setDraftStartDate(range.startDate);
    setDraftEndDate(range.endDate);
    setPage(0);
  }

  function applyCustomRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (draftStartDate > draftEndDate) {
      setErrorMessage("시작일은 종료일보다 앞서야 합니다.");
      return;
    }

    setSelectedPreset("CUSTOM");
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    setPage(0);
  }

  const pageLabel = statistics && statistics.totalPages > 0
    ? `${statistics.page + 1} / ${statistics.totalPages}`
    : "0 / 0";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header data-legacy-page-header className="border-b border-[#dbe4f0] bg-white/90">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">TM</span>
            <span className="truncate text-base font-semibold">Team Manager</span>
          </Link>
          {currentUser ? (
            <span className="truncate rounded-md border border-[#c8d4e6] bg-white px-3 py-2 text-sm font-semibold text-[#3d5b86]">{currentUser.name}</span>
          ) : (
            <Link href="/login" className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]">로그인</Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        {Number.isInteger(teamId) && teamId > 0 ? (
          <TeamDetailTabs teamId={teamId} activeTab="statistics" canManageFees={canManageFees} />
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">팀 통계를 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">팀 통계를 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            <button type="button" onClick={() => void loadStatistics()} className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]">다시 시도</button>
          </section>
        ) : team && statistics ? (
          <>
            <section className="flex flex-col gap-3 border-b border-[#dbe4f0] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#4f6f9f]">TEAM STATISTICS</p>
                <h1 className="mt-2 text-3xl font-bold text-[#0f172a] sm:text-4xl">{team.name} 통계</h1>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">참여 투표를 기준으로 선수별 출석 현황을 확인합니다.</p>
              </div>
              <span className="w-fit rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-3 py-1.5 text-sm font-semibold text-[#3d5b86]">기간 내 경기 {statistics.totalMatchCount}회</span>
            </section>

            <section className="border-y border-[#dbe4f0] py-5">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(periodPresetLabels) as Exclude<PeriodPreset, "CUSTOM">[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors ${selectedPreset === preset ? "border-[#4f6f9f] bg-[#4f6f9f] text-white" : "border-[#c8d4e6] bg-white text-[#3d5b86] hover:bg-[#f0f4fa]"}`}
                  >
                    {periodPresetLabels[preset]}
                  </button>
                ))}
              </div>

              <form onSubmit={applyCustomRange} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <label className="grid gap-1.5 text-sm font-semibold text-[#475569]">
                  시작일
                  <input type="date" value={draftStartDate} onChange={(event) => setDraftStartDate(event.target.value)} className="h-10 rounded-md border border-[#c8d4e6] bg-white px-3 text-sm font-normal text-[#1f2937] outline-none focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]" required />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-[#475569]">
                  종료일
                  <input type="date" value={draftEndDate} onChange={(event) => setDraftEndDate(event.target.value)} className="h-10 rounded-md border border-[#c8d4e6] bg-white px-3 text-sm font-normal text-[#1f2937] outline-none focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]" required />
                </label>
                <button type="submit" className="inline-flex h-10 items-center justify-center rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#e3ecf7]">기간 적용</button>
              </form>
            </section>

            <section className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0f172a]">선수별 출석</h2>
                  <p className="mt-1 text-sm text-[#64748b]">{statistics.startDate}부터 {statistics.endDate}까지</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-[#3d5b86]">총 {statistics.totalElements}명</span>
              </div>

              {statistics.members.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-[#64748b]">표시할 팀원이 없습니다.</div>
              ) : (
                <>
                  <div className="divide-y divide-[#e2e8f0] sm:hidden">
                    {statistics.members.map((member) => (
                      <article key={member.teamMemberId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4">
                        <p className="truncate font-semibold text-[#1f2937]">{member.name}</p>
                        <p className="font-bold text-[#3d5b86]">{formatRate(member.attendanceRate)}</p>
                        <p className="text-sm text-[#64748b]">출석 {member.attendanceCount}회 / 경기 {statistics.totalMatchCount}회</p>
                      </article>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                        <tr>
                          <th scope="col" className="px-6 py-3">선수</th>
                          <th scope="col" className="px-5 py-3 text-right">출석 횟수</th>
                          <th scope="col" className="px-6 py-3 text-right">출석률</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e8f0]">
                        {statistics.members.map((member) => (
                          <tr key={member.teamMemberId}>
                            <td className="px-6 py-4 font-semibold text-[#1f2937]">{member.name}</td>
                            <td className="px-5 py-4 text-right text-[#64748b]">{member.attendanceCount}회 / {statistics.totalMatchCount}회</td>
                            <td className="px-6 py-4 text-right font-bold text-[#3d5b86]">{formatRate(member.attendanceRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {statistics.totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-[#e2e8f0] px-5 py-4 sm:px-6">
                  <button type="button" onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))} disabled={statistics.page === 0} className="inline-flex h-9 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-3 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] disabled:cursor-not-allowed disabled:border-[#e2e8f0] disabled:text-[#94a3b8]">이전</button>
                  <span className="text-sm font-semibold text-[#64748b]">{pageLabel}</span>
                  <button type="button" onClick={() => setPage((currentPage) => currentPage + 1)} disabled={statistics.page >= statistics.totalPages - 1} className="inline-flex h-9 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-3 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] disabled:cursor-not-allowed disabled:border-[#e2e8f0] disabled:text-[#94a3b8]">다음</button>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
