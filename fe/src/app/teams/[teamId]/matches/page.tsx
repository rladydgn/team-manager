"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getTeamMatches,
  Match,
  updateMatchParticipation,
} from "@/features/match/api/match";
import { canUpdateMatchParticipation } from "@/features/match/model/participation";
import { MatchParticipationButton } from "@/features/match/ui/MatchParticipationButton";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { getTeam, TeamDetail } from "@/features/team/api/team";
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
      className: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
    };
  }

  if (new Date(match.matchAt).getTime() > Date.now()) {
    return {
      label: "매치 전",
      className: "border-[#cfe5d5] bg-[#f1f8f2] text-[#36734a]",
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

    const isParticipating = match.myParticipationStatus === "AVAILABLE";
    const nextStatus = isParticipating ? "UNAVAILABLE" : "AVAILABLE";

    try {
      await updateMatchParticipation(match.id, nextStatus);
      setNoticeMessage(
        isParticipating ? "매치 참여를 취소했습니다." : "매치 참여로 등록했습니다."
      );
      await loadMatches();
    } catch (error) {
      setParticipationErrorMessage(
        error instanceof Error ? error.message : "매치 참여 상태를 변경하지 못했습니다."
      );
    } finally {
      setUpdatingMatchId(null);
    }
  }

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
          <TeamDetailTabs teamId={teamId} activeTab="matches" canManageFees={canCreateMatch} />
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">경기 일정을 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">경기 일정을 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            <button type="button" onClick={() => void loadMatches()} className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]">다시 시도</button>
          </section>
        ) : teamDetail ? (
          <>
            <section className="flex flex-col gap-5 border-b border-[#dbe4f0] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#4f6f9f]">{teamDetail.team.shortName || "MATCH SCHEDULE"}</p>
                <h1 className="mt-2 text-3xl font-bold text-[#0f172a] sm:text-4xl">{teamDetail.team.name} 경기 일정</h1>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">등록된 매치를 시간순으로 확인할 수 있습니다.</p>
              </div>
              {canCreateMatch ? (
                <Link href={`/teams/${teamId}/matches/new`} className="inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]">
                  경기 등록
                </Link>
              ) : null}
            </section>

            {noticeMessage ? (
              <p className="rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-4 py-3 text-sm font-medium text-[#3d5b86]">
                {noticeMessage}
              </p>
            ) : null}

            {participationErrorMessage ? (
              <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
                {participationErrorMessage}
              </p>
            ) : null}

            {matches.length === 0 ? (
              <section className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-[#c8d4e6] bg-white px-5 py-12 text-center">
                <div>
                  <h2 className="text-xl font-bold text-[#0f172a]">등록된 매치가 없습니다.</h2>
                  <p className="mt-3 text-sm leading-6 text-[#64748b]">다음 경기를 등록하면 이곳에서 일정과 상세 정보를 확인할 수 있습니다.</p>
                </div>
              </section>
            ) : (
              <section className="divide-y divide-[#e2e8f0] overflow-hidden rounded-lg border border-[#dbe4f0] bg-white">
                {matches.map((match) => {
                  const isUpdating = updatingMatchId === match.id;

                  return (
                    <article
                      key={match.id}
                      className="flex flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <Link
                        href={`/matches/${match.id}`}
                        className="min-w-0 flex-1 transition-colors hover:text-[#3d5b86]"
                      >
                        <p className="text-sm font-semibold text-[#4f6f9f]">{formatMatchAt(match.matchAt)}</p>
                        <h2 className="mt-1 truncate text-lg font-bold text-[#1f2937]">
                          {teamDetail.team.name} <span className="mx-1 text-[#94a3b8]">vs</span> {getOpponentLabel(match)}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-[#64748b]">
                          <span>{match.location || "장소 미정"}</span>
                          <span aria-hidden="true" className="text-[#cbd5e1]">|</span>
                          <span className="font-medium text-[#52627b]">{match.availableParticipantCount}명 참여</span>
                        </div>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${getMatchProgress(match).className}`}>{getMatchProgress(match).label}</span>
                        <span className="rounded-md border border-[#dbe4f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">{match.matchType === "INTERNAL" ? "자체전" : "외부전"}</span>
                        {canUpdateMatchParticipation(match) ? (
                          <MatchParticipationButton
                            status={match.myParticipationStatus}
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
