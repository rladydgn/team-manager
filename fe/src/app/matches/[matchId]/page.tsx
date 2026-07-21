"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getMatch,
  getMatchParticipants,
  Match,
  MatchParticipant,
  updateMatchParticipation,
} from "@/features/match/api/match";
import { canUpdateMatchParticipation } from "@/features/match/model/participation";
import { MatchParticipationButton } from "@/features/match/ui/MatchParticipationButton";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { getTeam, Team, TeamMember } from "@/features/team/api/team";

const participationStatusLabels = {
  AVAILABLE: "참여",
  UNAVAILABLE: "불참",
  PENDING: "미응답",
  INVITED: "초대됨",
} as const;

const participationStatusClassNames = {
  AVAILABLE: "border-[#c8d4e6] bg-[#f0f4fa] text-[#3d5b86]",
  UNAVAILABLE: "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]",
  PENDING: "border-[#e2e8f0] bg-white text-[#64748b]",
  INVITED: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d5c99]",
} as const;

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

function formatParticipationRespondedAt(value: string | null) {
  if (!value) {
    return "응답 전";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MatchDetailPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = Number(params.matchId);
  const { currentUser, isSessionReady } = useAuthSession();
  const [match, setMatch] = useState<Match | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isParticipationUpdating, setIsParticipationUpdating] = useState(false);
  const [isMemoSaving, setIsMemoSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [participationErrorMessage, setParticipationErrorMessage] =
    useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [memoDraft, setMemoDraft] = useState("");

  const loadMatch = useCallback(async () => {
    if (!isSessionReady) {
      return;
    }

    if (!Number.isInteger(matchId) || matchId <= 0) {
      setErrorMessage("올바르지 않은 매치 주소입니다.");
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
      const matchResponse = await getMatch(matchId);

      if (!matchResponse.data) {
        throw new Error("매치 정보를 받지 못했습니다.");
      }

      const [teamResponse, participantsResponse] = await Promise.all([
        getTeam(matchResponse.data.teamId),
        getMatchParticipants(matchId),
      ]);
      setMatch(matchResponse.data);
      setTeam(teamResponse.data?.team ?? null);
      setTeamMembers(teamResponse.data?.members ?? []);
      const loadedParticipants = participantsResponse.data ?? [];
      setParticipants(loadedParticipants);
      const currentMember = teamResponse.data?.members.find(
        (member) => member.userId === currentUser.id,
      );
      setMemoDraft(
        loadedParticipants.find(
          (participant) => participant.teamMemberId === currentMember?.id,
        )?.memo ?? "",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "매치 정보를 불러오지 못했습니다.",
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
      void loadMatch();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isSessionReady, loadMatch]);

  const opponentLabel =
    match?.matchType === "INTERNAL"
      ? "자체전"
      : match?.opponentTeamName || "등록된 상대 팀";

  function applyParticipantUpdate(updatedParticipant: MatchParticipant) {
    setParticipants((currentParticipants) => {
      const hasCurrentParticipant = currentParticipants.some(
        (participant) =>
          participant.teamMemberId === updatedParticipant.teamMemberId,
      );

      return hasCurrentParticipant
        ? currentParticipants.map((participant) =>
            participant.teamMemberId === updatedParticipant.teamMemberId
              ? updatedParticipant
              : participant,
          )
        : [...currentParticipants, updatedParticipant];
    });
    setMemoDraft(updatedParticipant.memo ?? "");
  }

  function getMemoDraft() {
    return memoDraft;
  }

  async function handleParticipation() {
    if (!match) {
      return;
    }

    const isParticipating = match.myParticipationStatus === "AVAILABLE";
    const nextStatus = isParticipating ? "UNAVAILABLE" : "AVAILABLE";
    setParticipationErrorMessage("");
    setNoticeMessage("");
    setIsParticipationUpdating(true);

    try {
      const response = await updateMatchParticipation(
        match.id,
        nextStatus,
        getMemoDraft(),
      );

      if (!response.data) {
        throw new Error("매치 참여 상태를 받지 못했습니다.");
      }

      const updatedParticipant = response.data;

      setMatch((currentMatch) =>
        currentMatch
          ? {
              ...currentMatch,
              myParticipationStatus: nextStatus,
              availableParticipantCount: Math.max(
                0,
                currentMatch.availableParticipantCount +
                  (isParticipating ? -1 : 1),
              ),
            }
          : null,
      );
      applyParticipantUpdate(updatedParticipant);
      setNoticeMessage(
        isParticipating
          ? "매치 참여를 취소했습니다."
          : "매치 참여로 등록했습니다.",
      );
    } catch (error) {
      setParticipationErrorMessage(
        error instanceof Error
          ? error.message
          : "매치 참여 상태를 변경하지 못했습니다.",
      );
    } finally {
      setIsParticipationUpdating(false);
    }
  }

  async function handleMemoSave() {
    if (!match) {
      return;
    }

    if (
      match.myParticipationStatus !== "AVAILABLE" &&
      match.myParticipationStatus !== "UNAVAILABLE"
    ) {
      setParticipationErrorMessage("참여 또는 불참을 먼저 선택해 주세요.");
      return;
    }

    setParticipationErrorMessage("");
    setNoticeMessage("");
    setIsMemoSaving(true);

    try {
      const response = await updateMatchParticipation(
        match.id,
        match.myParticipationStatus,
        getMemoDraft(),
      );

      if (!response.data) {
        throw new Error("매치 참여 메모를 받지 못했습니다.");
      }

      applyParticipantUpdate(response.data);
      setNoticeMessage("메모를 저장했습니다.");
    } catch (error) {
      setParticipationErrorMessage(
        error instanceof Error ? error.message : "메모를 저장하지 못했습니다.",
      );
    } finally {
      setIsMemoSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header
        data-legacy-page-header
        className="border-b border-[#dbe4f0] bg-white/90"
      >
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">
              TM
            </span>
            <span className="truncate text-base font-semibold">
              Team Manager
            </span>
          </Link>
          {currentUser ? (
            <span className="truncate rounded-md border border-[#c8d4e6] bg-white px-3 py-2 text-sm font-semibold text-[#3d5b86]">
              {currentUser.name}
            </span>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-10 lg:px-8">
        {team ? (
          <Link
            href={`/teams/${team.id}/matches`}
            className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]"
          >
            경기 일정으로 돌아가기
          </Link>
        ) : null}

        {isLoading ? (
          <section className="flex min-h-80 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">
              매치 정보를 불러오는 중입니다.
            </p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">
              매치 정보를 불러올 수 없습니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => void loadMatch()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              다시 시도
            </button>
          </section>
        ) : match && team ? (
          <>
            <section className="overflow-hidden rounded-2xl border border-[#c8d4e6] bg-white shadow-[0_14px_32px_rgba(37,55,84,0.08)]">
              <div className="border-b border-[#d6e0ee] bg-[linear-gradient(135deg,#edf3fa_0%,#e3edf8_100%)] px-5 py-7 text-center sm:px-8 sm:py-10">
              <span className="rounded-md border border-[#b9c9df] bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                {match.matchType === "INTERNAL" ? "자체전" : "외부전"}
              </span>
              <p className="mt-5 text-sm font-semibold text-[#4f6f9f]">
                {formatMatchAt(match.matchAt)}
              </p>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
                <strong className="break-words text-xl text-[#0f172a] sm:text-3xl">
                  {team.name}
                </strong>
                <span className="text-sm font-bold text-[#64748b] sm:text-base">
                  VS
                </span>
                <strong className="break-words text-xl text-[#0f172a] sm:text-3xl">
                  {opponentLabel}
                </strong>
              </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 px-5 py-5 sm:flex-row sm:px-8">
                <span className="rounded-md border border-[#c8d4e6] bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                  {match.availableParticipantCount}명 참여
                </span>
                {canUpdateMatchParticipation(match) ? (
                  <MatchParticipationButton
                    status={match.myParticipationStatus}
                    isUpdating={isParticipationUpdating}
                    onClick={() => void handleParticipation()}
                  />
                ) : null}
              </div>
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

            <section className="grid divide-y divide-[#e2e8f0] overflow-hidden rounded-2xl border border-[#dbe4f0] bg-white shadow-[0_8px_24px_rgba(37,55,84,0.04)] [&>div]:p-5 sm:grid-cols-2 sm:divide-y-0 sm:[&>div:nth-child(odd)]:border-r sm:[&>div]:p-6 lg:grid-cols-4 lg:[&>div]:border-r lg:[&>div:nth-child(odd)]:border-r lg:[&>div:last-child]:border-r-0 lg:[&>div]:p-7">
              <div>
                <p className="text-sm font-semibold text-[#64748b]">우리 팀</p>
                <p className="mt-2 text-lg font-bold text-[#1f2937]">
                  {team.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">상대</p>
                <p className="mt-2 text-lg font-bold text-[#1f2937]">
                  {opponentLabel}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">
                  경기 장소
                </p>
                <p className="mt-2 text-lg font-bold text-[#1f2937]">
                  {match.location || "장소 미정"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#64748b]">상태</p>
                <p className="mt-2 text-lg font-bold text-[#1f2937]">
                  {match.status === "SCHEDULED"
                    ? "예정"
                    : match.status === "COMPLETED"
                      ? "종료"
                      : "취소"}
                </p>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#dbe4f0] bg-white shadow-[0_8px_24px_rgba(37,55,84,0.04)]">
              <div className="flex flex-col gap-3 border-b border-[#e2e8f0] bg-[#fbfcfe] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0f172a]">
                    팀원 참여 현황
                  </h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    매치 참여 여부를 팀원별로 확인할 수 있습니다.
                  </p>
                </div>
                <span className="w-fit rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                  {match.availableParticipantCount}명 참여
                </span>
              </div>

              <div className="divide-y divide-[#e2e8f0] md:hidden">
                {teamMembers.map((member) => {
                  const participant = participants.find(
                    (item) => item.teamMemberId === member.id,
                  );
                  const participationStatus = participant?.status ?? "PENDING";
                  const isCurrentUser = member.userId === currentUser?.id;
                  const canSaveMemo =
                    canUpdateMatchParticipation(match) &&
                    (participationStatus === "AVAILABLE" ||
                      participationStatus === "UNAVAILABLE");

                  return (
                    <article key={member.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-bold text-[#1f2937]">
                              {member.name ??
                                (member.userId ? "가입 팀원" : "미가입 팀원")}
                            </h3>
                            {isCurrentUser ? (
                              <span className="rounded border border-[#c8d4e6] bg-[#f0f4fa] px-1.5 py-0.5 text-[11px] font-bold text-[#3d5b86]">
                                나
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-[#64748b]">
                            {member.role === "OWNER"
                              ? "팀장"
                              : member.role === "SUB_MANAGER"
                                ? "부관리자"
                                : member.role === "GUEST"
                                  ? "게스트"
                                  : "팀원"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold ${participationStatusClassNames[participationStatus]}`}
                        >
                          {participationStatusLabels[participationStatus]}
                        </span>
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-[#f8fafc] p-3 text-xs">
                        <div>
                          <dt className="font-medium text-[#94a3b8]">응답 시간</dt>
                          <dd className="mt-1 leading-5 text-[#52627b]">
                            {formatParticipationRespondedAt(
                              participant?.respondedAt ?? null,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-[#94a3b8]">메모</dt>
                          <dd className="mt-1 break-words leading-5 text-[#52627b]">
                            {isCurrentUser ? memoDraft || "메모 없음" : participant?.memo || "메모 없음"}
                          </dd>
                        </div>
                      </dl>

                      {isCurrentUser ? (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={memoDraft}
                            onChange={(event) => setMemoDraft(event.target.value)}
                            maxLength={500}
                            disabled={!canUpdateMatchParticipation(match) || isMemoSaving}
                            placeholder="불참 사유 등 메모를 남겨주세요"
                            aria-label="매치 참여 메모"
                            className="h-10 min-w-0 flex-1 rounded-md border border-[#c8d4e6] bg-white px-3 text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8] focus:border-[#4f6f9f] disabled:cursor-not-allowed disabled:bg-[#f8fafc]"
                          />
                          <button
                            type="button"
                            onClick={() => void handleMemoSave()}
                            disabled={!canSaveMemo || isMemoSaving}
                            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-3 text-xs font-semibold text-[#3d5b86] transition-colors hover:bg-[#e3ecf7] disabled:cursor-not-allowed disabled:border-[#dbe4f0] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
                          >
                            {isMemoSaving ? "저장 중" : "저장"}
                          </button>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[52rem] text-left text-sm">
                  <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                    <tr>
                      <th scope="col" className="px-5 py-3 sm:px-6">
                        팀원
                      </th>
                      <th scope="col" className="px-5 py-3">
                        역할
                      </th>
                      <th scope="col" className="px-5 py-3">
                        참/불참 응답 시간
                      </th>
                      <th scope="col" className="px-5 py-3">
                        메모
                      </th>
                      <th scope="col" className="px-5 py-3 text-right sm:px-6">
                        참여 상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] [&>tr]:transition-colors [&>tr:hover]:bg-[#fbfcfe]">
                    {teamMembers.map((member) => {
                      const participant = participants.find(
                        (participant) => participant.teamMemberId === member.id,
                      );
                      const participationStatus =
                        participant?.status ?? "PENDING";
                      const isCurrentUser = member.userId === currentUser?.id;
                      const canSaveMemo =
                        canUpdateMatchParticipation(match) &&
                        (participationStatus === "AVAILABLE" ||
                          participationStatus === "UNAVAILABLE");

                      return (
                        <tr key={member.id}>
                          <td className="px-5 py-4 font-semibold text-[#1f2937] sm:px-6">
                            {member.name ??
                              (member.userId ? "가입 팀원" : "미가입 팀원")}
                          </td>
                          <td className="px-5 py-4 text-[#64748b]">
                            {member.role === "OWNER"
                              ? "팀장"
                              : member.role === "SUB_MANAGER"
                                ? "부관리자"
                                : member.role === "GUEST"
                                  ? "용병"
                                  : "팀원"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-[#64748b]">
                            {formatParticipationRespondedAt(
                              participant?.respondedAt ?? null,
                            )}
                          </td>
                          <td className="px-5 py-4 text-[#64748b]">
                            {isCurrentUser ? (
                              <div className="flex min-w-64 items-center gap-2">
                                <input
                                  type="text"
                                  value={memoDraft}
                                  onChange={(event) => setMemoDraft(event.target.value)}
                                  maxLength={500}
                                  disabled={
                                    !canUpdateMatchParticipation(match) ||
                                    isMemoSaving
                                  }
                                  placeholder="불참 사유 등을 남겨주세요"
                                  aria-label="매치 참여 메모"
                                  className="h-9 min-w-0 flex-1 rounded-md border border-[#c8d4e6] bg-white px-3 text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8] focus:border-[#4f6f9f] disabled:cursor-not-allowed disabled:bg-[#f8fafc]"
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleMemoSave()}
                                  disabled={!canSaveMemo || isMemoSaving}
                                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-3 text-xs font-semibold text-[#3d5b86] transition-colors hover:bg-[#e3ecf7] disabled:cursor-not-allowed disabled:border-[#dbe4f0] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
                                >
                                  {isMemoSaving ? "저장 중" : "저장"}
                                </button>
                              </div>
                            ) : (
                              <p className="max-w-52 whitespace-pre-wrap break-words leading-5">
                                {participant?.memo || "메모 없음"}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right sm:px-6">
                            <span
                              className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${participationStatusClassNames[participationStatus]}`}
                            >
                              {participationStatusLabels[participationStatus]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
