"use client";

import Link from "next/link";
import { MatchTrainingBadge } from "@/features/match/ui/MatchTrainingBadge";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTeamMatches,
  Match,
  updateMatchParticipation,
} from "@/features/match/api/match";
import { canUpdateMatchParticipation } from "@/features/match/model/participation";
import {
  getMatchResult,
  matchResultPresentation,
} from "@/features/match/model/result";
import { MatchParticipationButton } from "@/features/match/ui/MatchParticipationButton";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { getTeam, TeamDetail } from "@/features/team/api/team";
import { PageHeading } from "@/shared/ui/PageHeading";
import { TeamDetailTabs } from "@/features/team/ui/TeamDetailTabs";

function formatMatchAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getOpponentLabel(match: Match) {
  if (match.matchType === "INTERNAL") {
    return "자체전";
  }

  return match.opponentTeamName || "등록된 상대 팀";
}

function getMatchProgress(match: Match) {
  if (match.status === "CANCELED") {
    return {
      label: "취소됨",
      className: "border-danger-line bg-danger-soft text-danger",
    };
  }

  if (new Date(match.matchAt).getTime() > Date.now()) {
    return {
      label: "매치 전",
      className: "border-[#cfe5d5] bg-success-soft text-success",
    };
  }

  return {
    label: "매치 종료",
    className: "border-[#f3cfcc] bg-[#fff4f3] text-[#a85450]",
  };
}

export default function TeamMatchesPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingMatchId, setUpdatingMatchId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [participationErrorMessage, setParticipationErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const loadMatches = useCallback(async () => {
    if (!isSessionReady) {
      return;
    }

    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      setErrorMessage("로그인 후 팀 경기 일정을 확인할 수 있습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [teamResponse, matchesResponse] = await Promise.all([
        getTeam(teamId),
        getTeamMatches(teamId),
      ]);
      setTeamDetail(teamResponse.data);
      setMatches(matchesResponse.data ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "경기 일정을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isSessionReady, teamId]);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadMatches();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isSessionReady, loadMatches]);

  const canCreateMatch = useMemo(() => {
    const role = teamDetail?.members.find(
      (member) => member.userId === currentUser?.id
    )?.role;

    return role === "OWNER" || role === "SUB_MANAGER";
  }, [currentUser?.id, teamDetail?.members]);

  async function handleParticipation(match: Match) {
    setParticipationErrorMessage("");
    setNoticeMessage("");
    setUpdatingMatchId(match.id);

    const isParticipating = match.myVoteStatus === "AVAILABLE";
    const nextStatus = isParticipating ? "UNAVAILABLE" : "AVAILABLE";

    try {
      await updateMatchParticipation(match.id, nextStatus);
      setNoticeMessage(
        isParticipating ? "경기 참여를 취소했습니다." : "경기 참여로 등록했습니다."
      );
      await loadMatches();
    } catch (error) {
      setParticipationErrorMessage(
        error instanceof Error ? error.message : "경기 참여 상태를 변경하지 못했습니다."
      );
    } finally {
      setUpdatingMatchId(null);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        {Number.isInteger(teamId) && teamId > 0 ? (
          <TeamDetailTabs
            teamId={teamId}
            activeTab="matches"
            canAccessTeamFeatures={Boolean(teamDetail)}
            canManageFees={canCreateMatch}
          />
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">경기 일정을 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">경기 일정을 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-danger">{errorMessage}</p>
            <button type="button" onClick={() => void loadMatches()} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">다시 시도</button>
          </section>
        ) : teamDetail ? (
          <>
            <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <PageHeading label={teamDetail.team.name} title="경기 일정" description="경기 일정을 확인하고 참석 여부를 알려주세요." />
              {canCreateMatch ? (
                <div className="flex flex-wrap gap-2">
                  <Link href={`/team/${teamId}/match/history`} className="inline-flex h-11 items-center justify-center rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft">
                    이전 경기 등록
                  </Link>
                  <Link href={`/team/${teamId}/match/new`} className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">
                    경기 등록
                  </Link>
                </div>
              ) : null}
            </section>

            {noticeMessage ? (
              <p className="rounded-lg border border-line-strong bg-brand-soft px-4 py-3 text-sm font-medium text-brand-ink">
                {noticeMessage}
              </p>
            ) : null}

            {participationErrorMessage ? (
              <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                {participationErrorMessage}
              </p>
            ) : null}

            {matches.length === 0 ? (
              <section className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-line-strong bg-white px-5 py-12 text-center">
                <div>
                  <h2 className="text-xl font-semibold text-ink">등록된 경기가 없습니다.</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">다음 경기를 등록하면 이곳에서 일정과 상세 정보를 확인할 수 있습니다.</p>
                </div>
              </section>
            ) : (
              <section className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                {matches.map((match) => {
                  const isUpdating = updatingMatchId === match.id;
                  const matchResult = getMatchResult(match);

                  return (
                    <article
                      key={match.id}
                      className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <Link
                        href={`/match/${match.id}`}
                        className="min-w-0 flex-1 transition-colors hover:text-brand-ink"
                      >
                        <p className="text-sm font-semibold text-brand">{formatMatchAt(match.matchAt)}</p>
                        <h2 className="mt-1 truncate text-lg font-semibold text-ink">
                          {teamDetail.team.name} <span className="mx-1 text-placeholder">vs</span> {getOpponentLabel(match)}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                          <span>{match.location || "장소 미정"}</span>
                          <span aria-hidden="true" className="text-line-strong">|</span>
                          <span className="font-medium text-secondary">{match.availableParticipantCount}명 참여</span>
                        </div>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {matchResult ? (
                          <>
                            <span className="rounded-lg bg-ink px-2.5 py-1 text-sm font-semibold tabular-nums text-white">
                              {match.teamScore} : {match.opponentScore}
                            </span>
                            <span
                              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${matchResultPresentation[matchResult].className}`}
                            >
                              {matchResultPresentation[matchResult].label}
                            </span>
                          </>
                        ) : null}
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${getMatchProgress(match).className}`}>{getMatchProgress(match).label}</span>
                        <span className="rounded-lg border border-line bg-subtle px-2.5 py-1 text-xs font-semibold text-brand-ink">{match.matchType === "INTERNAL" ? "자체전" : "외부전"}</span>
                        <MatchTrainingBadge isTraining={match.isTraining} />
                        {canUpdateMatchParticipation(match) ? (
                          <MatchParticipationButton
                            status={match.myVoteStatus}
                            isUpdating={isUpdating}
                            onClick={() => void handleParticipation(match)}
                          />
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
