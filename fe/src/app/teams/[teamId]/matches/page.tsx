"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTeamMatches, Match } from "@/features/match/api/match";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { getTeam, TeamDetail } from "@/features/team/api/team";

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
      label: "경기 전",
      className: "border-[#c8d4e6] bg-[#f0f4fa] text-[#3d5b86]",
    };
  }

  return {
    label: "경기 후",
    className: "border-[#dbe4f0] bg-[#f8fafc] text-[#64748b]",
  };
}

export default function TeamMatchesPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
        <Link href={Number.isInteger(teamId) && teamId > 0 ? `/teams/${teamId}` : "/teams"} className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]">
          팀 상세로 돌아가기
        </Link>

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

            {matches.length === 0 ? (
              <section className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-[#c8d4e6] bg-white px-5 py-12 text-center">
                <div>
                  <h2 className="text-xl font-bold text-[#0f172a]">등록된 매치가 없습니다.</h2>
                  <p className="mt-3 text-sm leading-6 text-[#64748b]">다음 경기를 등록하면 이곳에서 일정과 상세 정보를 확인할 수 있습니다.</p>
                </div>
              </section>
            ) : (
              <section className="divide-y divide-[#e2e8f0] overflow-hidden rounded-lg border border-[#dbe4f0] bg-white">
                {matches.map((match) => (
                  <Link key={match.id} href={`/matches/${match.id}`} className="flex flex-col gap-3 px-5 py-5 transition-colors hover:bg-[#f8fafc] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#4f6f9f]">{formatMatchAt(match.matchAt)}</p>
                      <h2 className="mt-1 truncate text-lg font-bold text-[#1f2937]">{teamDetail.team.name} <span className="mx-1 text-[#94a3b8]">vs</span> {getOpponentLabel(match)}</h2>
                      <p className="mt-1 text-sm text-[#64748b]">{match.location || "장소 미정"}</p>
                    </div>
                    <div className="flex w-fit shrink-0 items-center gap-2">
                      <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${getMatchProgress(match).className}`}>{getMatchProgress(match).label}</span>
                      <span className="rounded-md border border-[#dbe4f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">{match.matchType === "INTERNAL" ? "자체전" : "외부전"}</span>
                    </div>
                  </Link>
                ))}
              </section>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
