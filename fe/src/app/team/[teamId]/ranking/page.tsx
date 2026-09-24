"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import {
  getTeamPlayerRankings,
  type TeamPlayerRankingEntry,
  type TeamPlayerRankings,
} from "@/features/team/api/statistics";
import { getTeam, type Team } from "@/features/team/api/team";
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

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getThisYearRange(): DateRange {
  const now = new Date();
  return {
    startDate: `${now.getFullYear()}-01-01`,
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
  if (preset === "SIX_MONTHS") return getRecentRange(6);
  if (preset === "ONE_YEAR") return getRecentRange(12);
  return getThisYearRange();
}

type RankingMetric = {
  key: "goalRankings" | "assistRankings" | "cleanSheetRankings";
  title: string;
  shortLabel: string;
  unit: string;
  accentClassName: string;
  softClassName: string;
};

const rankingMetrics: RankingMetric[] = [
  {
    key: "goalRankings",
    title: "득점 순위",
    shortLabel: "골",
    unit: "골",
    accentClassName: "text-[#315f9b]",
    softClassName: "border-line-strong bg-brand-soft",
  },
  {
    key: "assistRankings",
    title: "도움 순위",
    shortLabel: "어시스트",
    unit: "개",
    accentClassName: "text-[#695c91]",
    softClassName: "border-[#d8d4e9] bg-[#f6f5fb]",
  },
  {
    key: "cleanSheetRankings",
    title: "클린시트 순위",
    shortLabel: "클린시트",
    unit: "회",
    accentClassName: "text-success",
    softClassName: "border-success-line bg-success-soft",
  },
];

export default function TeamRankingPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const initialRange = getThisYearRange();
  const [team, setTeam] = useState<Team | null>(null);
  const [canManageSeasons, setCanManageSeasons] = useState(false);
  const [seasons, setSeasons] = useState<TeamSeason[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const defaultSeasonAppliedTeamId = useRef<number | null>(null);
  const [rankings, setRankings] = useState<TeamPlayerRankings | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>("THIS_YEAR");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [draftStartDate, setDraftStartDate] = useState(initialRange.startDate);
  const [draftEndDate, setDraftEndDate] = useState(initialRange.endDate);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRankings = useCallback(async () => {
    if (!isSessionReady) {
      return;
    }
    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }
    if (!currentUser) {
      setErrorMessage("로그인 후 팀 순위를 확인할 수 있습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const [teamResponse, rankingResponse, seasonResponse] = await Promise.all([
        getTeam(teamId),
        getTeamPlayerRankings(teamId, startDate, endDate),
        getTeamSeasons(teamId),
      ]);
      setTeam(teamResponse.data?.team ?? null);
      setCanManageSeasons(
        teamResponse.data?.members.some(
          (member) => member.userId === currentUser.id && (member.role === "OWNER" || member.role === "SUB_MANAGER")
        ) ?? false
      );
      setRankings(rankingResponse.data ?? null);
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
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀 순위를 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, endDate, isSessionReady, startDate, teamId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadRankings();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [loadRankings]);

  function selectPreset(preset: Exclude<PeriodPreset, "CUSTOM">) {
    const range = getPresetRange(preset);
    setSelectedPreset(preset);
    setSelectedSeasonId("");
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setDraftStartDate(range.startDate);
    setDraftEndDate(range.endDate);
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
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        {Number.isInteger(teamId) && teamId > 0 ? (
          <TeamDetailTabs teamId={teamId} activeTab="rankings" canAccessTeamFeatures={Boolean(team)} canManageFees={canManageSeasons} />
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">선수 순위를 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">순위를 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-danger">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadRankings()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              다시 시도
            </button>
          </section>
        ) : team && rankings ? (
          <>
            <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <PageHeading label={team.name} title="기록 순위" description="선택한 기간의 정식 경기 기록을 기준으로 집계합니다." />
              <span className="w-fit rounded-lg border border-line-strong bg-white px-3 py-1.5 text-sm font-semibold text-brand-ink">
                집계 경기 {rankings.completedMatchCount}회
              </span>
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
                {canManageSeasons ? <Link href={`/team/${teamId}/season`} className="inline-flex h-11 items-center justify-center rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-brand-ink">시즌 설정</Link> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(periodPresetLabels) as Exclude<PeriodPreset, "CUSTOM">[]).map(
                  (preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors ${
                        selectedPreset === preset
                          ? "border-brand bg-brand text-white"
                          : "border-line-strong bg-white text-brand-ink hover:bg-brand-soft"
                      }`}
                    >
                      {periodPresetLabels[preset]}
                    </button>
                  )
                )}
              </div>

              <form
                onSubmit={applyCustomRange}
                className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
              >
                <label className="grid gap-1.5 text-sm font-semibold text-secondary">
                  시작일
                  <input
                    type="date"
                    value={draftStartDate}
                    onChange={(event) => setDraftStartDate(event.target.value)}
                    className="h-10 rounded-lg border border-line-strong bg-white px-3 text-sm font-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    required
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-secondary">
                  종료일
                  <input
                    type="date"
                    value={draftEndDate}
                    onChange={(event) => setDraftEndDate(event.target.value)}
                    className="h-10 rounded-lg border border-line-strong bg-white px-3 text-sm font-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-line-strong bg-brand-soft px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft"
                >
                  기간 적용
                </button>
              </form>
              <p className="mt-3 text-xs font-medium text-muted">
                현재 집계 기간: {rankings.startDate} ~ {rankings.endDate}
              </p>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">나의 순위</h2>
                <span className="text-xs font-medium text-muted">동점자는 같은 순위로 표시됩니다.</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {rankingMetrics.map((metric) => {
                  const mine = rankings[metric.key].find((entry) => entry.isCurrentUser);
                  return (
                    <article
                      key={metric.key}
                      className={`rounded-xl border p-5 ${metric.softClassName}`}
                    >
                      <p className="text-sm font-semibold text-secondary">{metric.shortLabel}</p>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <p className={`text-3xl font-semibold ${metric.accentClassName}`}>
                          {mine ? `${mine.rank}위` : "-"}
                        </p>
                        <p className="text-sm font-semibold text-secondary">
                          {mine ? `${mine.value}${metric.unit}` : "기록 없음"}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              {rankingMetrics.map((metric) => (
                <Leaderboard
                  key={metric.key}
                  metric={metric}
                  entries={rankings[metric.key]}
                />
              ))}
            </section>

            <Link
              href={`/team/${teamId}/statistics`}
              className="inline-flex w-fit text-sm font-semibold text-brand-ink hover:text-brand-hover"
            >
              상세 통계 보기
            </Link>
          </>
        ) : null}
      </div>
    </main>
  );
}

function Leaderboard({
  metric,
  entries,
}: {
  metric: RankingMetric;
  entries: TeamPlayerRankingEntry[];
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white">
      <div className={`border-b px-5 py-4 ${metric.softClassName}`}>
        <h2 className={`text-lg font-semibold ${metric.accentClassName}`}>{metric.title}</h2>
      </div>
      {entries.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">표시할 팀원이 없습니다.</p>
      ) : (
        <ol className="divide-y divide-[#edf1f6]">
          {entries.map((entry) => (
            <li
              key={entry.teamMemberId}
              className={`grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 ${
                entry.isCurrentUser ? "bg-[#eef4fc] ring-1 ring-inset ring-[#b9cbe3]" : ""
              }`}
            >
              <span
                className={`grid size-8 place-items-center rounded-full text-sm font-semibold ${rankBadgeClassName(entry.rank)}`}
              >
                {entry.rank}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {entry.name}
                </span>
                {entry.isCurrentUser ? (
                  <span className="mt-0.5 block text-xs font-semibold text-brand">나</span>
                ) : null}
              </span>
              <strong className={`text-base ${metric.accentClassName}`}>
                {entry.value}{metric.unit}
              </strong>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function rankBadgeClassName(rank: number) {
  if (rank === 1) return "bg-[#fff2b8] text-[#8a6400]";
  if (rank === 2) return "bg-[#e8edf3] text-[#526174]";
  if (rank === 3) return "bg-[#f2dfd2] text-[#8a5635]";
  return "bg-[#f1f5f9] text-muted";
}
