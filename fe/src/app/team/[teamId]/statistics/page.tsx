"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthSession } from "@/features/auth/model/auth-session";
import {
  getTeamAttendanceStatistics,
  SortDirection,
  TeamAttendanceStatistics,
  TeamAttendanceSortBy,
} from "@/features/team/api/statistics";
import { getTeam, Team } from "@/features/team/api/team";
import { getTeamSeasons, type TeamSeason } from "@/features/team/api/season";
import { PageHeading } from "@/shared/ui/PageHeading";
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

const statisticSortLabels: Record<TeamAttendanceSortBy, string> = {
  NAME: "이름",
  ATTENDANCE_RATE: "경기 출석",
  TRAINING_ATTENDANCE_RATE: "훈련 출석",
  POST_VOTE_ABSENCE_COUNT: "투표 후 불참",
  LATE_COUNT: "지각",
  GOAL_COUNT: "골",
  ASSIST_COUNT: "어시스트",
  CLEAN_SHEET_COUNT: "클린시트",
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
    endDate: toDateInputValue(now),
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

function formatAttendance(attendanceCount: number, eligibleMatchCount: number, attendanceRate: number) {
  return `${attendanceCount}회 / ${eligibleMatchCount}회 (${formatRate(attendanceRate)})`;
}

export default function TeamStatisticsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const initialRange = getThisYearRange();
  const [team, setTeam] = useState<Team | null>(null);
  const [canManageFees, setCanManageFees] = useState(false);
  const [seasons, setSeasons] = useState<TeamSeason[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const defaultSeasonAppliedTeamId = useRef<number | null>(null);
  const [statistics, setStatistics] = useState<TeamAttendanceStatistics | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>("THIS_YEAR");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [draftStartDate, setDraftStartDate] = useState(initialRange.startDate);
  const [draftEndDate, setDraftEndDate] = useState(initialRange.endDate);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<TeamAttendanceSortBy>("NAME");
  const [sortDirection, setSortDirection] = useState<SortDirection>("ASC");
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
      const [teamResponse, statisticsResponse, seasonResponse] = await Promise.all([
        getTeam(teamId),
        getTeamAttendanceStatistics(teamId, startDate, endDate, page, sortBy, sortDirection),
        getTeamSeasons(teamId),
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
      const loadedSeasons = seasonResponse.data ?? [];
      setSeasons(loadedSeasons);
      if (defaultSeasonAppliedTeamId.current !== teamId) {
        defaultSeasonAppliedTeamId.current = teamId;
        const defaultSeason = loadedSeasons.find((season) => season.isDefault);
        if (defaultSeason) {
          setSelectedSeasonId(String(defaultSeason.id));
          setSelectedPreset("CUSTOM");
          setStartDate(defaultSeason.startDate);
          setEndDate(defaultSeason.endDate);
          setDraftStartDate(defaultSeason.startDate);
          setDraftEndDate(defaultSeason.endDate);
          setPage(0);
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀 통계를 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, endDate, isSessionReady, page, sortBy, sortDirection, startDate, teamId]);

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
    setSelectedSeasonId("");
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
    setSelectedSeasonId("");
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    setPage(0);
  }

  function selectSeason(seasonId: string) {
    setSelectedSeasonId(seasonId);
    const season = seasons.find((item) => String(item.id) === seasonId);
    if (!season) return;
    setSelectedPreset("CUSTOM");
    setStartDate(season.startDate);
    setEndDate(season.endDate);
    setDraftStartDate(season.startDate);
    setDraftEndDate(season.endDate);
    setPage(0);
  }

  function toggleStatisticSort(nextSortBy: TeamAttendanceSortBy) {
    setPage(0);

    if (sortBy === nextSortBy) {
      setSortDirection((currentDirection) =>
        currentDirection === "ASC" ? "DESC" : "ASC"
      );
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection("ASC");
  }

  const pageLabel = statistics && statistics.totalPages > 0
    ? `${statistics.page + 1} / ${statistics.totalPages}`
    : "0 / 0";

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        {Number.isInteger(teamId) && teamId > 0 ? (
          <TeamDetailTabs
            teamId={teamId}
            activeTab="statistics"
            canAccessTeamFeatures={Boolean(team)}
            canManageFees={canManageFees}
          />
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">팀 통계를 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">팀 통계를 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-danger">{errorMessage}</p>
            <button type="button" onClick={() => void loadStatistics()} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">다시 시도</button>
          </section>
        ) : team && statistics ? (
          <>
            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <PageHeading label={team.name} title="선수 통계" description="기간별 출석과 경기 기록을 확인하세요." />
              <span className="w-fit rounded-lg border border-line-strong bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-ink">기간 내 전체 경기 {statistics.totalMatchCount}회 · 그중 훈련 {statistics.totalTrainingCount}회</span>
            </section>

            <section className="border-y border-line py-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <label className="grid flex-1 gap-1.5 text-sm font-semibold text-secondary">
                  시즌
                  <select value={selectedSeasonId} onChange={(event) => selectSeason(event.target.value)} className="h-11 rounded-lg border border-line-strong bg-white px-3 text-sm font-normal text-ink outline-none focus:border-brand">
                    {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}{season.isDefault ? " (기본)" : ""} · {season.startDate} ~ {season.endDate}</option>)}
                    <option value="">기간 직접 선택</option>
                  </select>
                </label>
                {canManageFees ? <Link href={`/team/${teamId}/season`} className="inline-flex h-11 items-center justify-center rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-brand-ink">시즌 설정</Link> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(periodPresetLabels) as Exclude<PeriodPreset, "CUSTOM">[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors ${selectedPreset === preset ? "border-brand bg-brand text-white" : "border-line-strong bg-white text-brand-ink hover:bg-brand-soft"}`}
                  >
                    {periodPresetLabels[preset]}
                  </button>
                ))}
              </div>

              <form onSubmit={applyCustomRange} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <label className="grid gap-1.5 text-sm font-semibold text-secondary">
                  시작일
                  <input type="date" value={draftStartDate} onChange={(event) => setDraftStartDate(event.target.value)} className="h-10 rounded-lg border border-line-strong bg-white px-3 text-sm font-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring" required />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-secondary">
                  종료일
                  <input type="date" value={draftEndDate} onChange={(event) => setDraftEndDate(event.target.value)} className="h-10 rounded-lg border border-line-strong bg-white px-3 text-sm font-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring" required />
                </label>
                <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg border border-line-strong bg-brand-soft px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft">기간 적용</button>
              </form>
            </section>

            <section className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-ink">선수별 기록</h2>
                  <p className="mt-1 text-sm text-muted">{statistics.startDate}부터 {statistics.endDate}까지</p>
                  <p className="mt-1 text-xs font-semibold text-brand">정렬: {statisticSortLabels[sortBy]} {sortDirection === "ASC" ? "오름차순" : "내림차순"}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-brand-ink">총 {statistics.totalElements}명</span>
              </div>

              {statistics.members.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-muted">표시할 팀원이 없습니다.</div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3 sm:hidden">
                    {(Object.keys(statisticSortLabels) as TeamAttendanceSortBy[]).map((targetSortBy) => (
                      <button
                        key={targetSortBy}
                        type="button"
                        onClick={() => toggleStatisticSort(targetSortBy)}
                        aria-pressed={sortBy === targetSortBy}
                        className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${sortBy === targetSortBy ? "border-brand bg-brand-soft text-brand-ink" : "border-line bg-white text-muted"}`}
                      >
                        {statisticSortLabels[targetSortBy]}
                        <SortArrows active={sortBy === targetSortBy} direction={sortDirection} />
                      </button>
                    ))}
                  </div>
                  <div className="divide-y divide-line sm:hidden">
                    {statistics.members.map((member) => (
                      <article key={member.teamMemberId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4">
                        <p className="truncate font-semibold text-ink">{member.name}</p>
                        <p className="text-sm font-semibold text-brand-ink">경기 출석 {formatAttendance(member.attendanceCount, member.eligibleMatchCount, member.attendanceRate)}</p>
                        <p className="text-sm font-semibold text-success">훈련 출석 {formatAttendance(member.trainingAttendanceCount, member.trainingEligibleMatchCount, member.trainingAttendanceRate)}</p>
                        <p className="text-sm text-[#b45309]">투표 후 불참 {member.postVoteAbsenceCount}회</p>
                        <p className="text-sm text-[#b45309]">지각 {member.lateCount}회</p>
                        <div className="col-span-2 flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-lg border border-line-strong bg-brand-soft px-2 py-1 text-brand-ink">골 {member.goalCount}</span>
                          <span className="rounded-lg border border-[#d8d4e9] bg-[#f6f5fb] px-2 py-1 text-[#695c91]">어시스트 {member.assistCount}</span>
                          <span className="rounded-lg border border-success-line bg-success-soft px-2 py-1 text-success">클린시트 {member.cleanSheetCount}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-subtle text-xs font-semibold text-muted">
                        <tr>
                          <SortableHeader label="선수" sortKey="NAME" activeSort={sortBy} direction={sortDirection} onSort={toggleStatisticSort} className="px-6 text-left" />
                          <SortableHeader label="경기 출석 (투표/전체)" sortKey="ATTENDANCE_RATE" activeSort={sortBy} direction={sortDirection} onSort={toggleStatisticSort} />
                          <SortableHeader label="훈련 출석 (투표/전체)" sortKey="TRAINING_ATTENDANCE_RATE" activeSort={sortBy} direction={sortDirection} onSort={toggleStatisticSort} />
                          <SortableHeader label="투표 후 불참" sortKey="POST_VOTE_ABSENCE_COUNT" activeSort={sortBy} direction={sortDirection} onSort={toggleStatisticSort} />
                          <SortableHeader label="지각" sortKey="LATE_COUNT" activeSort={sortBy} direction={sortDirection} onSort={toggleStatisticSort} />
                          <SortableHeader label="골" sortKey="GOAL_COUNT" activeSort={sortBy} direction={sortDirection} onSort={toggleStatisticSort} />
                          <SortableHeader label="어시스트" sortKey="ASSIST_COUNT" activeSort={sortBy} direction={sortDirection} onSort={toggleStatisticSort} />
                          <SortableHeader label="클린시트" sortKey="CLEAN_SHEET_COUNT" activeSort={sortBy} direction={sortDirection} onSort={toggleStatisticSort} className="px-6" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {statistics.members.map((member) => (
                          <tr key={member.teamMemberId}>
                            <td className="px-6 py-4 font-semibold text-ink">{member.name}</td>
                            <td className="px-5 py-4 text-right font-semibold text-brand-ink">{formatAttendance(member.attendanceCount, member.eligibleMatchCount, member.attendanceRate)}</td>
                            <td className="px-5 py-4 text-right font-semibold text-success">{formatAttendance(member.trainingAttendanceCount, member.trainingEligibleMatchCount, member.trainingAttendanceRate)}</td>
                            <td className="px-5 py-4 text-right font-semibold text-[#b45309]">{member.postVoteAbsenceCount}회</td>
                            <td className="px-4 py-4 text-right font-semibold text-[#b45309]">{member.lateCount}회</td>
                            <td className="px-4 py-4 text-right font-semibold text-brand-ink">{member.goalCount}</td>
                            <td className="px-4 py-4 text-right font-semibold text-[#695c91]">{member.assistCount}</td>
                            <td className="px-6 py-4 text-right font-semibold text-success">{member.cleanSheetCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {statistics.totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-line px-5 py-4 sm:px-6">
                  <button type="button" onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))} disabled={statistics.page === 0} className="inline-flex h-9 items-center justify-center rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:border-line disabled:text-placeholder">이전</button>
                  <span className="text-sm font-semibold text-muted">{pageLabel}</span>
                  <button type="button" onClick={() => setPage((currentPage) => currentPage + 1)} disabled={statistics.page >= statistics.totalPages - 1} className="inline-flex h-9 items-center justify-center rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:border-line disabled:text-placeholder">다음</button>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function SortArrows({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (active) {
    return (
      <span aria-hidden="true" className="text-sm font-black leading-none text-brand-ink">
        {direction === "ASC" ? "▲" : "▼"}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="flex flex-col text-[7px] leading-[6px] text-[#a4afbe]">
      <span>▲</span>
      <span>▼</span>
    </span>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  direction,
  onSort,
  className = "px-4 text-right",
}: {
  label: string;
  sortKey: TeamAttendanceSortBy;
  activeSort: TeamAttendanceSortBy;
  direction: SortDirection;
  onSort: (sortBy: TeamAttendanceSortBy) => void;
  className?: string;
}) {
  const isActive = activeSort === sortKey;
  const nextDirection = isActive && direction === "ASC" ? "내림차순" : "오름차순";

  return (
    <th
      scope="col"
      aria-sort={isActive ? (direction === "ASC" ? "ascending" : "descending") : "none"}
      className={`${className} py-3`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-pressed={isActive}
        aria-label={`${label} ${nextDirection} 정렬`}
        className={`inline-flex items-center gap-1.5 rounded-sm px-1 py-0.5 transition-colors ${
          isActive ? "font-semibold text-brand-ink" : "font-semibold text-muted hover:text-brand-ink"
        }`}
      >
        {label}
        <SortArrows active={isActive} direction={direction} />
      </button>
    </th>
  );
}
