"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getMatch, Match } from "@/features/match/api/match";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import { getTeam, Team } from "@/features/team/api/team";

function formatMatchAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MatchDetailPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = Number(params.matchId);
  const currentUser = useCurrentUser();
  const [match, setMatch] = useState<Match | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMatch = useCallback(async () => {
    if (!Number.isInteger(matchId) || matchId <= 0) {
      setErrorMessage("올바르지 않은 매치 주소입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const matchResponse = await getMatch(matchId);

      if (!matchResponse.data) {
        throw new Error("매치 정보를 받지 못했습니다.");
      }

      const teamResponse = await getTeam(matchResponse.data.teamId);
      setMatch(matchResponse.data);
      setTeam(teamResponse.data?.team ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "매치 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadMatch();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadMatch]);

  const opponentLabel = match?.matchType === "INTERNAL" ? "자체전" : match?.opponentTeamName || "등록된 상대 팀";

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header className="border-b border-[#dbe4f0] bg-white/90">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">TM</span>
            <span className="truncate text-base font-semibold">Team Manager</span>
          </Link>
          {currentUser ? <span className="truncate rounded-md border border-[#c8d4e6] bg-white px-3 py-2 text-sm font-semibold text-[#3d5b86]">{currentUser.name}</span> : <Link href="/login" className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]">로그인</Link>}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        {team ? <Link href={`/teams/${team.id}/matches`} className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]">경기 일정으로 돌아가기</Link> : null}

        {isLoading ? (
          <section className="flex min-h-80 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white"><p className="text-sm font-semibold text-[#64748b]">매치 정보를 불러오는 중입니다.</p></section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">매치 정보를 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            <button type="button" onClick={() => void loadMatch()} className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]">다시 시도</button>
          </section>
        ) : match && team ? (
          <>
            <section className="rounded-lg border border-[#cdd9ea] bg-[#eaf0f8] px-5 py-7 text-center sm:px-8 sm:py-10">
              <span className="rounded-md border border-[#b9c9df] bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">{match.matchType === "INTERNAL" ? "자체전" : "외부전"}</span>
              <p className="mt-5 text-sm font-semibold text-[#4f6f9f]">{formatMatchAt(match.matchAt)}</p>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
                <strong className="break-words text-xl text-[#0f172a] sm:text-3xl">{team.name}</strong>
                <span className="text-sm font-bold text-[#64748b] sm:text-base">VS</span>
                <strong className="break-words text-xl text-[#0f172a] sm:text-3xl">{opponentLabel}</strong>
              </div>
            </section>

            <section className="grid gap-5 rounded-lg border border-[#dbe4f0] bg-white p-5 sm:grid-cols-2 sm:p-7">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">우리 팀</p>
                <p className="mt-2 text-lg font-bold text-[#1f2937]">{team.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">상대</p>
                <p className="mt-2 text-lg font-bold text-[#1f2937]">{opponentLabel}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">경기 장소</p>
                <p className="mt-2 text-lg font-bold text-[#1f2937]">{match.location || "장소 미정"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">상태</p>
                <p className="mt-2 text-lg font-bold text-[#1f2937]">{match.status === "SCHEDULED" ? "예정" : match.status === "COMPLETED" ? "종료" : "취소"}</p>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
