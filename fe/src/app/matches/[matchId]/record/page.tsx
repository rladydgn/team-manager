"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import {
  getMatch,
  getMatchParticipants,
  Match,
  updateMatchRecord,
} from "@/features/match/api/match";
import { getTeam, Team, TeamMember } from "@/features/team/api/team";

type PlayerStatistics = {
  goalCount: number;
  assistCount: number;
  cleanSheetCount: number;
};

function isMatchManager(role: TeamMember["role"] | undefined) {
  return role === "OWNER" || role === "SUB_MANAGER";
}

function getPlayerName(member: TeamMember) {
  return member.name ?? (member.userId ? "가입 팀원" : "미가입 팀원");
}

function normalizeCount(value: number) {
  return Number.isFinite(value) ? Math.min(99, Math.max(0, Math.trunc(value))) : 0;
}

export default function MatchRecordPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = Number(params.matchId);
  const { currentUser, isSessionReady } = useAuthSession();
  const [match, setMatch] = useState<Match | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [statisticsByMemberId, setStatisticsByMemberId] = useState<
    Record<number, PlayerStatistics>
  >({});
  const [opponentScore, setOpponentScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const canManageRecords = isMatchManager(
    teamMembers.find((member) => member.userId === currentUser?.id)?.role
  );
  const matchTeamMembers = teamMembers.filter((member) =>
    Object.prototype.hasOwnProperty.call(statisticsByMemberId, member.id)
  );
  const teamScore = useMemo(
    () =>
      Object.values(statisticsByMemberId).reduce(
        (total, statistic) => total + statistic.goalCount,
        0
      ),
    [statisticsByMemberId]
  );
  const totalAssistCount = useMemo(
    () =>
      Object.values(statisticsByMemberId).reduce(
        (total, statistic) => total + statistic.assistCount,
        0
      ),
    [statisticsByMemberId]
  );
  const opponentLabel =
    match?.matchType === "INTERNAL"
      ? "상대 팀"
      : match?.opponentTeamName || "등록된 상대 팀";

  const loadMatchRecord = useCallback(async () => {
    if (!isSessionReady) {
      return;
    }

    if (!Number.isInteger(matchId) || matchId <= 0) {
      setErrorMessage("올바르지 않은 매치 주소입니다.");
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      setErrorMessage("로그인 후 경기 기록을 관리할 수 있습니다.");
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

      const [teamResponse, participantsResponse] = await Promise.all([
        getTeam(matchResponse.data.teamId),
        getMatchParticipants(matchId),
      ]);
      const detail = teamResponse.data;
      const members = detail?.members ?? [];
      const role = members.find((member) => member.userId === currentUser.id)?.role;

      if (!detail || !isMatchManager(role)) {
        setMatch(matchResponse.data);
        setTeam(detail?.team ?? null);
        setTeamMembers(members);
        setErrorMessage("경기 기록은 팀장 또는 부관리자만 관리할 수 있습니다.");
        return;
      }

      const participantsByMemberId = new Map(
        (participantsResponse.data ?? []).map((participant) => [
          participant.teamMemberId,
          participant,
        ])
      );
      const matchMembers = members.filter((member) =>
        participantsByMemberId.has(member.id)
      );
      const nextStatistics = matchMembers.reduce<Record<number, PlayerStatistics>>(
        (statistics, member) => {
          const participant = participantsByMemberId.get(member.id);
          statistics[member.id] = {
            goalCount: participant?.goalCount ?? 0,
            assistCount: participant?.assistCount ?? 0,
            cleanSheetCount: participant?.cleanSheetCount ?? 0,
          };
          return statistics;
        },
        {}
      );

      setMatch(matchResponse.data);
      setTeam(detail.team);
      setTeamMembers(members);
      setStatisticsByMemberId(nextStatistics);
      setOpponentScore(matchResponse.data.opponentScore ?? 0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "경기 기록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isSessionReady, matchId]);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadMatchRecord();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isSessionReady, loadMatchRecord]);

  function updatePlayerStatistic(
    teamMemberId: number,
    field: keyof PlayerStatistics,
    value: number
  ) {
    setStatisticsByMemberId((current) => ({
      ...current,
      [teamMemberId]: {
        ...(current[teamMemberId] ?? {
          goalCount: 0,
          assistCount: 0,
          cleanSheetCount: 0,
        }),
        [field]: normalizeCount(value),
      },
    }));
  }

  async function saveMatchRecord() {
    if (!match || !canManageRecords) {
      return;
    }

    if (totalAssistCount > teamScore) {
      setFormErrorMessage("어시스트 합계는 골 합계보다 클 수 없습니다.");
      return;
    }

    setIsSaving(true);
    setFormErrorMessage("");
    setNoticeMessage("");

    try {
      const response = await updateMatchRecord(match.id, {
        opponentScore: normalizeCount(opponentScore),
        participants: matchTeamMembers.map((member) => ({
          teamMemberId: member.id,
          ...(statisticsByMemberId[member.id] ?? {
            goalCount: 0,
            assistCount: 0,
            cleanSheetCount: 0,
          }),
        })),
      });

      if (!response.data) {
        throw new Error("저장된 경기 기록을 받지 못했습니다.");
      }

      setMatch(response.data);
      setNoticeMessage("경기 기록을 저장했습니다.");
    } catch (error) {
      setFormErrorMessage(
        error instanceof Error ? error.message : "경기 기록을 저장하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header data-legacy-page-header className="border-b border-[#dbe4f0] bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-10 lg:px-8">
        {team ? (
          <Link href={`/matches/${matchId}`} className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]">
            매치 상세로 돌아가기
          </Link>
        ) : null}

        {isLoading ? (
          <section className="flex min-h-80 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">경기 기록을 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">경기 기록을 열 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            {canManageRecords ? <button type="button" onClick={() => void loadMatchRecord()} className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]">다시 시도</button> : null}
          </section>
        ) : match && team ? (
          <>
            <section className="rounded-lg border border-[#c8d4e6] bg-white shadow-[0_10px_24px_rgba(37,55,84,0.06)]">
              <div className="border-b border-[#dbe4f0] bg-[#f0f4fa] px-5 py-5 sm:px-6">
                <p className="text-sm font-semibold text-[#4f6f9f]">MATCH RECORD</p>
                <h1 className="mt-2 text-2xl font-bold text-[#0f172a] sm:text-3xl">{team.name} 경기 기록</h1>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-5 py-6 text-center sm:gap-6 sm:px-8">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#52627b]">{team.name}</p>
                  <p className="mt-2 text-4xl font-bold text-[#0f172a]">{teamScore}</p>
                  <p className="mt-1 text-xs text-[#64748b]">선수 골 합계</p>
                </div>
                <span className="text-sm font-bold text-[#94a3b8]">:</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#52627b]">{opponentLabel}</p>
                  <input type="number" min="0" max="99" value={opponentScore} onChange={(event) => setOpponentScore(normalizeCount(event.target.valueAsNumber))} disabled={isSaving} aria-label="상대 팀 점수" className="mt-2 h-12 w-20 rounded-md border border-[#c8d4e6] bg-white text-center text-2xl font-bold text-[#0f172a] outline-none focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5] disabled:cursor-not-allowed" />
                  <p className="mt-1 text-xs text-[#64748b]">상대 팀 점수</p>
                </div>
              </div>
            </section>

            {noticeMessage ? <p className="rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-4 py-3 text-sm font-medium text-[#3d5b86]">{noticeMessage}</p> : null}
            {formErrorMessage ? <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">{formErrorMessage}</p> : null}

            <section className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white">
              <div className="flex flex-col gap-2 border-b border-[#e2e8f0] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0f172a]">선수 기록</h2>
                  <p className="mt-1 text-sm text-[#64748b]">골 {teamScore} · 어시스트 {totalAssistCount}</p>
                </div>
                <p className="text-sm font-medium text-[#64748b]">쿼터별 클린시트 횟수를 합산해 기록합니다.</p>
              </div>

              <div className="divide-y divide-[#e2e8f0]">
                {matchTeamMembers.map((member) => {
                  const statistic = statisticsByMemberId[member.id] ?? { goalCount: 0, assistCount: 0, cleanSheetCount: 0 };

                  return (
                    <div key={member.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_7rem] sm:items-center sm:px-6">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#1f2937]">{getPlayerName(member)}</p>
                        <p className="mt-1 text-xs text-[#64748b]">{member.role === "OWNER" ? "팀장" : member.role === "SUB_MANAGER" ? "부관리자" : member.role === "GUEST" ? "용병" : "팀원"}</p>
                      </div>
                      <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-semibold text-[#52627b] sm:grid-cols-1 sm:gap-1 sm:text-center">
                        <span>골</span>
                        <input type="number" min="0" max="99" value={statistic.goalCount} onChange={(event) => updatePlayerStatistic(member.id, "goalCount", event.target.valueAsNumber)} disabled={isSaving} className="h-9 min-w-0 rounded-md border border-[#c8d4e6] bg-white px-2 text-center text-sm font-semibold text-[#1f2937] outline-none focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5] disabled:cursor-not-allowed" />
                      </label>
                      <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-semibold text-[#52627b] sm:grid-cols-1 sm:gap-1 sm:text-center">
                        <span>어시스트</span>
                        <input type="number" min="0" max="99" value={statistic.assistCount} onChange={(event) => updatePlayerStatistic(member.id, "assistCount", event.target.valueAsNumber)} disabled={isSaving} className="h-9 min-w-0 rounded-md border border-[#c8d4e6] bg-white px-2 text-center text-sm font-semibold text-[#1f2937] outline-none focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5] disabled:cursor-not-allowed" />
                      </label>
                      <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-semibold text-[#52627b] sm:grid-cols-1 sm:gap-1 sm:text-center">
                        <span>클린시트</span>
                        <input type="number" min="0" max="99" value={statistic.cleanSheetCount} onChange={(event) => updatePlayerStatistic(member.id, "cleanSheetCount", event.target.valueAsNumber)} disabled={isSaving} className="h-9 min-w-0 rounded-md border border-[#c8d4e6] bg-white px-2 text-center text-sm font-semibold text-[#1f2937] outline-none focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5] disabled:cursor-not-allowed" />
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end border-t border-[#e2e8f0] bg-[#fbfcfe] px-5 py-4 sm:px-6">
                <button type="button" onClick={() => void saveMatchRecord()} disabled={isSaving || totalAssistCount > teamScore} className="inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#a9b9d3]">
                  {isSaving ? "저장 중" : "전체 기록 저장"}
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
