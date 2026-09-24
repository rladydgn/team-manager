"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createHistoricalMatch,
  getMatch,
  getMatchParticipants,
  HistoricalMatchParticipantCreateRequest,
  MatchType,
  updateHistoricalMatchParticipants,
} from "@/features/match/api/match";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import { getTeam, TeamDetail, TeamMember } from "@/features/team/api/team";

type HistoricalParticipantStatus = HistoricalMatchParticipantCreateRequest["voteStatus"];

const matchTypes: { value: MatchType; label: string }[] = [
  { value: "EXTERNAL", label: "외부전" },
  { value: "INTERNAL", label: "자체전" },
];

function cleanOptionalValue(value: string) {
  return value.trim() || undefined;
}

function toDateTimeLocalValue(value: Date) {
  const localValue = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);

  return localValue.toISOString().slice(0, 16);
}

function getMemberName(member: TeamMember) {
  return member.name ?? (member.userId ? "가입 팀원" : "미가입 팀원");
}

function getMemberRole(member: TeamMember) {
  if (member.role === "OWNER") {
    return "팀장";
  }
  if (member.role === "SUB_MANAGER") {
    return "부팀장";
  }
  if (member.role === "GUEST") {
    return "용병";
  }
  return "팀원";
}

export default function HistoricalMatchCreatePage() {
  const params = useParams<{ teamId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamId = Number(params.teamId);
  const historicalMatchId = Number(searchParams.get("matchId"));
  const isEditMode = Number.isInteger(historicalMatchId) && historicalMatchId > 0;
  const currentUser = useCurrentUser();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [matchType, setMatchType] = useState<MatchType>("EXTERNAL");
  const [isTraining, setIsTraining] = useState(false);
  const [opponentTeamName, setOpponentTeamName] = useState("");
  const [matchAt, setMatchAt] = useState("");
  const [location, setLocation] = useState("");
  const [participantStatusByMemberId, setParticipantStatusByMemberId] = useState<
    Record<number, HistoricalParticipantStatus>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTeam = useCallback(async () => {
    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getTeam(teamId);
      if (isEditMode) {
        const [matchResponse, participantsResponse] = await Promise.all([
          getMatch(historicalMatchId),
          getMatchParticipants(historicalMatchId),
        ]);
        const historicalMatch = matchResponse.data;

        if (!historicalMatch || historicalMatch.teamId !== teamId) {
          throw new Error("이전 경기 정보를 불러오지 못했습니다.");
        }

        setMatchType(historicalMatch.matchType);
        setIsTraining(historicalMatch.isTraining);
        setOpponentTeamName(historicalMatch.opponentTeamName ?? "");
        setMatchAt(toDateTimeLocalValue(new Date(historicalMatch.matchAt)));
        setLocation(historicalMatch.location ?? "");
        setParticipantStatusByMemberId(
          (participantsResponse.data ?? []).reduce<
            Record<number, HistoricalParticipantStatus>
          >(
            (next, participant) => ({
              ...next,
              [participant.teamMemberId]:
                participant.voteStatus === "UNAVAILABLE"
                  ? "UNAVAILABLE"
                  : "AVAILABLE",
            }),
            {}
          )
        );
      } else {
        setParticipantStatusByMemberId({});
      }
      setTeamDetail(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀 정보를 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [historicalMatchId, isEditMode, teamId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadTeam();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadTeam]);

  const currentMember = useMemo(
    () => teamDetail?.members.find((member) => member.userId === currentUser?.id),
    [currentUser?.id, teamDetail?.members]
  );
  const canCreateMatch =
    currentMember?.role === "OWNER" || currentMember?.role === "SUB_MANAGER";
  const members = teamDetail?.members ?? [];
  const selectedMemberCount = Object.keys(participantStatusByMemberId).length;
  const areAllMembersSelected =
    members.length > 0 && members.every((member) => member.id in participantStatusByMemberId);

  function toggleMember(memberId: number, selected: boolean) {
    setParticipantStatusByMemberId((current) => {
      if (!selected) {
        const remaining = { ...current };
        delete remaining[memberId];
        return remaining;
      }

      return { ...current, [memberId]: "AVAILABLE" };
    });
  }

  function toggleAllMembers(selected: boolean) {
    if (!selected) {
      setParticipantStatusByMemberId({});
      return;
    }

    setParticipantStatusByMemberId(
      members.reduce<Record<number, HistoricalParticipantStatus>>(
        (next, member) => ({ ...next, [member.id]: "AVAILABLE" }),
        {}
      )
    );
  }

  function updateMemberStatus(memberId: number, voteStatus: HistoricalParticipantStatus) {
    setParticipantStatusByMemberId((current) => ({
      ...current,
      [memberId]: voteStatus,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!teamDetail || !canCreateMatch) {
      setErrorMessage("이전 경기를 등록할 권한이 없습니다.");
      return;
    }

    if (!isEditMode && (!matchAt || new Date(matchAt).getTime() > Date.now())) {
      setErrorMessage("경기 일시는 현재보다 이전이어야 합니다.");
      return;
    }

    const participants = members.flatMap((member) => {
      const voteStatus = participantStatusByMemberId[member.id];
      return voteStatus ? [{ teamMemberId: member.id, voteStatus }] : [];
    });

    if (participants.length === 0) {
      setErrorMessage("통계에 반영할 팀원을 한 명 이상 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = isEditMode
        ? await updateHistoricalMatchParticipants(historicalMatchId, { participants })
        : await createHistoricalMatch({
            teamId: teamDetail.team.id,
            matchType,
            isTraining,
            opponentTeamName:
              matchType === "EXTERNAL"
                ? cleanOptionalValue(opponentTeamName)
                : undefined,
            matchAt,
            location: cleanOptionalValue(location),
            participants,
          });

      if (!response.data) {
        throw new Error("경기 정보를 받지 못했습니다.");
      }

      router.replace(`/match/${isEditMode ? historicalMatchId : response.data.id}/record`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "이전 경기를 등록하지 못했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link href={isEditMode ? `/match/${historicalMatchId}/record` : Number.isInteger(teamId) && teamId > 0 ? `/team/${teamId}/match` : "/team"} className="inline-flex w-fit text-sm font-semibold text-brand-ink transition-colors hover:text-brand-hover">
          {isEditMode ? "경기 기록으로 돌아가기" : "경기 일정으로 돌아가기"}
        </Link>

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">팀 정보를 불러오는 중입니다.</p>
          </section>
        ) : errorMessage && !teamDetail ? (
          <section className="rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">이전 경기 {isEditMode ? "수정" : "등록"} 화면을 열 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-danger">{errorMessage}</p>
            <button type="button" onClick={() => void loadTeam()} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">다시 시도</button>
          </section>
        ) : !currentUser ? (
          <section className="rounded-xl border border-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">로그인이 필요합니다.</h1>
            <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">로그인</Link>
          </section>
        ) : !canCreateMatch ? (
          <section className="rounded-xl border border-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">경기 {isEditMode ? "수정" : "등록"} 권한이 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-muted">운영진만 이전 경기를 {isEditMode ? "수정" : "등록"}할 수 있습니다.</p>
          </section>
        ) : teamDetail ? (
          <form className="grid gap-6 rounded-xl border border-line bg-white p-5 shadow-card sm:p-7" onSubmit={handleSubmit}>
            <div className="border-b border-line pb-5">
              <p className="text-sm font-semibold text-brand">지난 경기</p>
              <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">이전 경기 {isEditMode ? "참가 명단 수정" : "등록"}</h1>
              <p className="mt-2 text-sm text-muted">{teamDetail.team.name}</p>
            </div>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-semibold">매치 유형</legend>
              <div className="grid grid-cols-2 rounded-lg border border-line-strong bg-subtle p-1">
                {matchTypes.map((type) => (
                  <button key={type.value} type="button" onClick={() => setMatchType(type.value)} disabled={isEditMode} className={`h-10 rounded-sm text-sm font-semibold transition-colors disabled:cursor-not-allowed ${matchType === type.value ? "bg-brand text-white shadow-sm" : "text-secondary hover:bg-white"}`}>
                    {type.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-subtle px-4 py-3 text-sm font-semibold text-secondary">
              <input type="checkbox" checked={isTraining} onChange={(event) => setIsTraining(event.target.checked)} disabled={isEditMode} className="size-4 accent-brand disabled:cursor-not-allowed" />
              훈련으로 등록
              <span className="font-normal text-muted">통계에서 경기 출석과 별도로 집계됩니다.</span>
            </label>

            {matchType === "EXTERNAL" ? (
              <label className="grid gap-2 text-sm font-semibold">
                상대 팀명
                <input value={opponentTeamName} onChange={(event) => setOpponentTeamName(event.target.value)} maxLength={100} required disabled={isEditMode} className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-subtle" placeholder="강남 FC" />
              </label>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                경기 일시
                <input value={matchAt} onChange={(event) => setMatchAt(event.target.value)} max={toDateTimeLocalValue(new Date())} type="datetime-local" step={600} required disabled={isEditMode} className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-subtle" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                경기 장소
                <input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={255} disabled={isEditMode} className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-subtle" placeholder="잠실 풋살장" />
              </label>
            </div>

            <section className="overflow-hidden rounded-lg border border-line">
              <div className="flex flex-col gap-3 border-b border-line bg-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2 className="font-semibold text-ink">통계 대상 팀원</h2>
                  <p className="mt-1 text-sm text-muted">{selectedMemberCount}명 선택</p>
                </div>
                <label className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-ink">
                  <input type="checkbox" checked={areAllMembersSelected} onChange={(event) => toggleAllMembers(event.target.checked)} className="size-4 accent-brand" />
                  전체 선택
                </label>
              </div>
              <div className="divide-y divide-line">
                {members.map((member) => {
                  const voteStatus = participantStatusByMemberId[member.id];
                  const isSelected = voteStatus !== undefined;
                  return (
                    <div key={member.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center sm:px-5">
                      <label className="flex min-w-0 items-center gap-3">
                        <input type="checkbox" checked={isSelected} onChange={(event) => toggleMember(member.id, event.target.checked)} className="size-4 shrink-0 accent-brand" />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{getMemberName(member)}</span>
                          <span className="mt-0.5 block text-xs text-muted">{getMemberRole(member)}</span>
                        </span>
                      </label>
                      <select value={voteStatus ?? "AVAILABLE"} onChange={(event) => updateMemberStatus(member.id, event.target.value as HistoricalParticipantStatus)} disabled={!isSelected} className="h-10 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-brand-ink outline-none focus:border-brand disabled:cursor-not-allowed disabled:bg-subtle disabled:text-placeholder">
                        <option value="AVAILABLE">참여</option>
                        <option value="UNAVAILABLE">불참</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </section>

            {errorMessage ? <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{errorMessage}</p> : null}

            <button type="submit" disabled={isSubmitting || !matchAt || selectedMemberCount === 0 || (matchType === "EXTERNAL" && !opponentTeamName.trim())} className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-5 text-base font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-brand-disabled">
              {isSubmitting ? (isEditMode ? "수정 중..." : "등록 중...") : isEditMode ? "참가 명단 저장" : "경기 기록 입력으로 이동"}
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
