"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import {
  getMatch,
  getMatchParticipants,
  Match,
  updateMatchRecord,
} from "@/features/match/api/match";
import { getTeam, Team, TeamMember } from "@/features/team/api/team";
import { sideLabels, type ParticipantSide } from "@/features/match/api/formations";
import { calculateInternalScores, needsInternalRecordReview } from "@/features/match/model/internal-record";
import { ApiRequestError } from "@/shared/api/http";
import {
  changeActualParticipation,
  hasAttendanceConflict,
  toPlayerStatistics,
  type PlayerStatistics,
} from "@/features/match/model/record-statistics";

type PlayerStatisticCountField = Exclude<
  keyof PlayerStatistics,
  "actualParticipated" | "late"
>;

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
  const router = useRouter();
  const matchId = Number(params.matchId);
  const { currentUser, isSessionReady } = useAuthSession();
  const [match, setMatch] = useState<Match | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [recordMembers, setRecordMembers] = useState<TeamMember[]>([]);
  const [statisticsByMemberId, setStatisticsByMemberId] = useState<
    Record<number, PlayerStatistics>
  >({});
  const [opponentScore, setOpponentScore] = useState(0);
  const [unknownGoalCount, setUnknownGoalCount] = useState(0);
  const [unknownAssistCount, setUnknownAssistCount] = useState(0);
  const [awayUnknownGoalCount, setAwayUnknownGoalCount] = useState(0);
  const [awayUnknownAssistCount, setAwayUnknownAssistCount] = useState(0);
  const [sides, setSides] = useState<Record<number, ParticipantSide>>({});
  const [originalSides, setOriginalSides] = useState<Record<number, ParticipantSide>>({});
  const [confirmLegacyConversion, setConfirmLegacyConversion] = useState(false);
  const [versionConflict, setVersionConflict] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const canManageRecords = isMatchManager(
    teamMembers.find((member) => member.userId === currentUser?.id)?.role
  );
  const areAllMatchMembersParticipating =
    recordMembers.length > 0 &&
    recordMembers.every(
      (member) => statisticsByMemberId[member.id]?.actualParticipated
    );
  const conflictingMembers = recordMembers.filter((member) =>
    hasAttendanceConflict(toPlayerStatistics(statisticsByMemberId[member.id]))
  );
  const isInternal = match?.matchType === "INTERNAL";
  const legacyReview = match ? needsInternalRecordReview(match) : false;
  const internalScores = calculateInternalScores(statisticsByMemberId, sides, {
    homeGoals: unknownGoalCount, homeAssists: unknownAssistCount,
    awayGoals: awayUnknownGoalCount, awayAssists: awayUnknownAssistCount,
  });
  const teamScore = useMemo(
    () =>
      Object.values(statisticsByMemberId).reduce(
        (total, statistic) => total + statistic.goalCount,
        unknownGoalCount
      ),
    [statisticsByMemberId, unknownGoalCount]
  );
  const totalAssistCount = useMemo(
    () =>
      Object.values(statisticsByMemberId).reduce(
        (total, statistic) => total + statistic.assistCount,
        unknownAssistCount
      ),
    [statisticsByMemberId, unknownAssistCount]
  );
  const opponentLabel =
    match?.matchType === "INTERNAL"
      ? "상대 팀"
      : match?.opponentTeamName || "등록된 상대 팀";
  const invalidRecord = conflictingMembers.length > 0 || (isInternal
    ? internalScores.invalidAssists || internalScores.unassignedRecordIds.length > 0 || (legacyReview && !confirmLegacyConversion)
    : totalAssistCount > teamScore);

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
        throw new Error("경기 정보를 받지 못했습니다.");
      }

      const [teamResponse, participantsResponse] = await Promise.all([
        getTeam(matchResponse.data.teamId),
        getMatchParticipants(matchId),
      ]);
      const detail = teamResponse.data;
      if (!participantsResponse.data) throw new Error("참가자 기록을 받지 못했습니다. 다시 불러와 주세요.");
      const members = detail?.members ?? [];
      const role = members.find((member) => member.userId === currentUser.id)?.role;

      if (!detail || !isMatchManager(role)) {
        setMatch(matchResponse.data);
        setTeam(detail?.team ?? null);
        setTeamMembers(members);
        setRecordMembers([]);
        setErrorMessage("경기 기록은 운영진만 관리할 수 있습니다.");
        return;
      }

      const participantsByMemberId = new Map(
        (participantsResponse.data ?? []).map((participant) => [
          participant.teamMemberId,
          participant,
        ])
      );
      const membersById = new Map(members.map((member) => [member.id, member]));
      const nextRecordMembers = (participantsResponse.data ?? []).map((participant) =>
        membersById.get(participant.teamMemberId) ?? {
          id: participant.teamMemberId,
          userId: null,
          name: participant.name ?? "내보낸 팀원",
          memo: null,
          mainPosition: participant.mainPosition,
          jerseyNumber: participant.jerseyNumber,
          role: participant.role ?? "MEMBER",
          status: "LEFT" as const,
          joinedAt: null,
          requestedAt: "",
        }
      ).sort((left, right) =>
        getPlayerName(left).localeCompare(getPlayerName(right), "ko") || left.id - right.id
      );
      const nextStatistics = nextRecordMembers.reduce<Record<number, PlayerStatistics>>(
        (statistics, member) => {
          const participant = participantsByMemberId.get(member.id);
          statistics[member.id] = toPlayerStatistics(participant);
          return statistics;
        },
        {}
      );

      setMatch(matchResponse.data);
      setTeam(detail.team);
      setTeamMembers(members);
      setRecordMembers(nextRecordMembers);
      setStatisticsByMemberId(nextStatistics);
      const nextSides = Object.fromEntries(participantsResponse.data.map(player => [player.teamMemberId, player.teamSide]));
      setSides(nextSides); setOriginalSides(nextSides);
      setConfirmLegacyConversion(false); setVersionConflict(false);
      const needsReview = needsInternalRecordReview(matchResponse.data);
      setOpponentScore(matchResponse.data.opponentScore ?? 0);
      setUnknownGoalCount(needsReview ? 0 : (matchResponse.data.unknownGoalCount ?? 0));
      setUnknownAssistCount(needsReview ? 0 : (matchResponse.data.unknownAssistCount ?? 0));
      setAwayUnknownGoalCount(matchResponse.data.awayUnknownGoalCount ?? 0);
      setAwayUnknownAssistCount(matchResponse.data.awayUnknownAssistCount ?? 0);
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
    field: PlayerStatisticCountField,
    value: number
  ) {
    setStatisticsByMemberId((current) => ({
      ...current,
      [teamMemberId]: {
        ...(current[teamMemberId] ?? {
          actualParticipated: false,
          late: false,
          goalCount: 0,
          assistCount: 0,
          cleanSheetCount: 0,
        }),
        [field]: normalizeCount(value),
      },
    }));
  }

  function updatePlayerParticipation(teamMemberId: number, actualParticipated: boolean) {
    setStatisticsByMemberId((current) => ({
      ...current,
      [teamMemberId]: changeActualParticipation(current[teamMemberId], actualParticipated),
    }));
  }

  function updatePlayerLate(teamMemberId: number, late: boolean) {
    setStatisticsByMemberId((current) => ({
      ...current,
      [teamMemberId]: {
        ...(current[teamMemberId] ?? {
          actualParticipated: false,
          late: false,
          goalCount: 0,
          assistCount: 0,
          cleanSheetCount: 0,
        }),
        late,
      },
    }));
  }

  function updateAllPlayerParticipation(actualParticipated: boolean) {
    setStatisticsByMemberId((current) =>
      recordMembers.reduce<Record<number, PlayerStatistics>>(
        (next, member) => ({
          ...next,
          [member.id]: changeActualParticipation(current[member.id], actualParticipated),
        }),
        current
      )
    );
  }

  async function saveMatchRecord() {
    if (!match || !canManageRecords) {
      return;
    }

    if (conflictingMembers.length > 0) {
      setFormErrorMessage("불참 선수의 골·어시스트·클린시트·지각을 직접 정정하거나 실제 참여를 선택해 주세요.");
      return;
    }
    if (isInternal && invalidRecord) {
      setFormErrorMessage("편 배정·편별 골과 어시스트·기존 기록 전환 확인을 모두 완료해 주세요.");
      return;
    }
    if (isInternal && recordMembers.some(member => sides[member.id] !== originalSides[member.id]) &&
      !window.confirm("편 변경과 기록을 함께 저장하면 양쪽 점수를 다시 계산하고 기존 포메이션의 일부 배치는 제외 상태가 됩니다. 저장할까요?")) return;

    if (
      match.status === "SCHEDULED" &&
      !window.confirm(
        "경기 기록을 저장하면 참여/불참 투표를 더 이상 변경할 수 없습니다. 저장하시겠습니까?"
      )
    ) {
      return;
    }

    if (!isInternal && totalAssistCount > teamScore) {
      setFormErrorMessage("어시스트 합계는 골 합계보다 클 수 없습니다.");
      return;
    }

    setIsSaving(true);
    setFormErrorMessage("");
    setNoticeMessage("");

    try {
      const response = await updateMatchRecord(match.id, {
        opponentScore: isInternal ? 0 : normalizeCount(opponentScore),
        unknownGoalCount: isInternal ? 0 : normalizeCount(unknownGoalCount),
        unknownAssistCount: isInternal ? 0 : normalizeCount(unknownAssistCount),
        ...(isInternal ? { internalRecord: {
          sideAssignmentVersion: match.sideAssignmentVersion ?? 1,
          homeUnknownGoalCount: normalizeCount(unknownGoalCount),
          homeUnknownAssistCount: normalizeCount(unknownAssistCount),
          awayUnknownGoalCount: normalizeCount(awayUnknownGoalCount),
          awayUnknownAssistCount: normalizeCount(awayUnknownAssistCount), confirmLegacyConversion,
        } } : {}),
        participants: recordMembers.map((member) => {
          const statistic = statisticsByMemberId[member.id];

          return {
            teamMemberId: member.id,
            actualParticipated: statistic?.actualParticipated ?? false,
            late: statistic?.late ?? false,
            goalCount: statistic?.goalCount ?? 0,
            assistCount: statistic?.assistCount ?? 0,
            cleanSheetCount: statistic?.cleanSheetCount ?? 0,
            ...(isInternal ? { teamSide: sides[member.id] ?? "UNASSIGNED" } : {}),
          };
        }),
      });

      if (!response.data) {
        throw new Error("저장된 경기 기록을 받지 못했습니다.");
      }

      setMatch(response.data);
      router.replace(`/match/${response.data.id}`);
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "INTERNAL_MATCH_RECORD_VERSION_CONFLICT") setVersionConflict(true);
      setFormErrorMessage(
        error instanceof Error ? error.message : "경기 기록을 저장하지 못했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-10 lg:px-8">
        {team ? (
          <Link href={`/match/${matchId}`} className="inline-flex w-fit text-sm font-semibold text-brand-ink transition-colors hover:text-brand-hover">
            매치 상세로 돌아가기
          </Link>
        ) : null}

        {isLoading ? (
          <section className="flex min-h-80 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">경기 기록을 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">경기 기록을 열 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-danger">{errorMessage}</p>
            {canManageRecords ? <button type="button" onClick={() => void loadMatchRecord()} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover">다시 시도</button> : null}
          </section>
        ) : match && team ? (
          <>
            <section className="rounded-xl border border-line-strong bg-white shadow-card">
              <div className="border-b border-line bg-brand-soft px-5 py-5 sm:px-6">
                <p className="text-sm font-semibold text-brand">경기 기록 관리</p>
                <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">{team.name} 경기 기록</h1>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-5 py-6 text-center sm:gap-6 sm:px-8">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-secondary">{isInternal ? "홈" : team.name}</p>
                  <p className="mt-2 text-4xl font-semibold text-ink">{isInternal ? internalScores.homeGoals : teamScore}</p>
                  <p className="mt-1 text-xs text-muted">{isInternal ? "홈 골 합계" : "팀 골 합계"}</p>
                </div>
                <span className="text-sm font-semibold text-placeholder">:</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-secondary">{isInternal ? "어웨이" : opponentLabel}</p>
                  {isInternal ? <p className="mt-2 text-4xl font-semibold text-ink">{internalScores.awayGoals}</p> : <input type="number" min="0" max="99" value={opponentScore} onChange={(event) => setOpponentScore(normalizeCount(event.target.valueAsNumber))} disabled={isSaving} aria-label="상대 팀 점수" className="mt-2 h-12 w-20 rounded-lg border border-line-strong bg-white text-center text-2xl font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed" />}
                  <p className="mt-1 text-xs text-muted">{isInternal ? "어웨이 골 합계" : "상대 팀 점수"}</p>
                </div>
              </div>
            </section>

            {noticeMessage ? <p className="rounded-lg border border-line-strong bg-brand-soft px-4 py-3 text-sm font-medium text-brand-ink">{noticeMessage}</p> : null}
            {formErrorMessage ? <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{formErrorMessage}</p> : null}
            {versionConflict ? <button type="button" className="btn-secondary w-fit" onClick={() => {
              if (window.confirm("현재 입력을 버리고 최신 편 배정과 기록을 다시 불러올까요?")) { setFormErrorMessage(""); void loadMatchRecord(); }
            }}>최신 기록 다시 불러오기</button> : null}
            {legacyReview ? <section className="rounded-lg border border-line-strong bg-brand-soft p-4 text-sm leading-6 text-brand-ink">
              <p className="font-semibold">편별 기록 확인 필요</p>
              <p>기존 점수 {match.teamScore ?? "미입력"} : {match.opponentScore ?? "미입력"} · 기존 미상 골 {match.unknownGoalCount} · 미상 어시스트 {match.unknownAssistCount}</p>
              <p>원본은 아직 바뀌지 않았습니다. 기존 미상 기록은 어느 편인지 추정하지 않고 아래 입력을 0부터 시작합니다. 선수 편과 각 편의 미상 기록을 직접 확인해 주세요.</p>
              <label className="mt-3 flex items-start gap-2"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-brand" checked={confirmLegacyConversion} onChange={event => setConfirmLegacyConversion(event.target.checked)} disabled={isSaving} />기존 점수·미상 기록과 편 배정을 확인했으며 편별 기록으로 전환합니다.</label>
            </section> : null}
            {isInternal && internalScores.unassignedRecordIds.length > 0 ? <p role="alert" className="rounded-lg bg-danger-soft p-4 text-sm text-danger">미배정 선수의 골·어시스트·클린시트가 있습니다. 홈 또는 어웨이를 먼저 지정해 주세요.</p> : null}
            {isInternal && internalScores.invalidAssists ? <p role="alert" className="rounded-lg bg-danger-soft p-4 text-sm text-danger">각 편의 어시스트 합계는 해당 편의 골 합계보다 클 수 없습니다.</p> : null}
            {conflictingMembers.length > 0 ? (
              <p role="alert" className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                불참과 개인 기록이 함께 있는 선수가 있습니다. 기록은 자동으로 바뀌지 않습니다. 해당 선수의 골·어시스트·클린시트·지각을 직접 정정하거나 실제 참여를 선택한 뒤 저장해 주세요.
              </p>
            ) : null}

            <section className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="flex flex-col gap-2 border-b border-line px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-ink">선수 기록</h2>
                  <p className="mt-1 text-sm text-muted">{isInternal ? `홈 골 ${internalScores.homeGoals} · 어시스트 ${internalScores.homeAssists} / 어웨이 골 ${internalScores.awayGoals} · 어시스트 ${internalScores.awayAssists}` : `골 ${teamScore} · 어시스트 ${totalAssistCount}`}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  {match.status === "COMPLETED" ? (
                    <Link href={`/team/${team.id}/match/history?matchId=${matchId}`} className="inline-flex h-9 items-center justify-center rounded-lg border border-[#b9c8dd] bg-white px-3 text-sm font-semibold text-brand-ink transition-colors hover:border-[#8fa6c7] hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-brand-ring">
                      참가 명단 수정
                    </Link>
                  ) : null}
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink">
                    <input
                      type="checkbox"
                      checked={areAllMatchMembersParticipating}
                      onChange={(event) => updateAllPlayerParticipation(event.target.checked)}
                      disabled={isSaving || recordMembers.length === 0}
                      aria-label="전체 실제 참여 선택"
                      className="size-4 accent-brand disabled:cursor-not-allowed"
                    />
                    전체 실제 참여
                  </label>
                  <p className="text-sm font-medium text-muted">쿼터별 클린시트 횟수를 합산해 기록합니다.</p>
                </div>
              </div>

              <div className="divide-y divide-line">
                {recordMembers.map((member) => {
                  const statistic = statisticsByMemberId[member.id] ?? { actualParticipated: false, late: false, goalCount: 0, assistCount: 0, cleanSheetCount: 0 };

                  return (
                    <div key={member.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_5rem_5rem_6rem] lg:items-center sm:px-6">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{getPlayerName(member)}</p>
                        <p className="mt-1 text-xs text-muted">{member.role === "OWNER" ? "팀장" : member.role === "SUB_MANAGER" ? "부팀장" : member.role === "GUEST" ? "용병" : "팀원"}</p>
                        {isInternal ? <label className="mt-2 flex items-center gap-2 text-sm text-secondary">편
                          <select aria-label={`${getPlayerName(member)} 기록 편`} className="field min-w-0 max-w-full" value={sides[member.id] ?? "UNASSIGNED"} disabled={isSaving} onChange={event => setSides(current => ({ ...current, [member.id]: event.target.value as ParticipantSide }))}>
                            {Object.entries(sideLabels).map(([side, label]) => <option key={side} value={side}>{label}</option>)}
                          </select>
                        </label> : null}
                        {hasAttendanceConflict(statistic) ? <p className="mt-2 text-sm font-medium text-danger">불참·기록 확인 필요</p> : null}
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-secondary sm:flex-col sm:gap-1 sm:text-center">
                        <input type="checkbox" checked={statistic.actualParticipated} onChange={(event) => updatePlayerParticipation(member.id, event.target.checked)} disabled={isSaving} className="size-4 accent-brand disabled:cursor-not-allowed" />
                        <span>실제 참여</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-secondary sm:flex-col sm:gap-1 sm:text-center">
                        <input type="checkbox" checked={statistic.late} onChange={(event) => updatePlayerLate(member.id, event.target.checked)} disabled={isSaving || (!statistic.actualParticipated && !statistic.late)} className="size-4 accent-[#b45309] disabled:cursor-not-allowed" />
                        <span>지각</span>
                      </label>
                      <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-semibold text-secondary sm:grid-cols-1 sm:gap-1 sm:text-center">
                        <span>골</span>
                        <input type="number" min="0" max="99" value={statistic.goalCount} onChange={(event) => updatePlayerStatistic(member.id, "goalCount", event.target.valueAsNumber)} disabled={isSaving} className="h-9 min-w-0 rounded-lg border border-line-strong bg-white px-2 text-center text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed" />
                      </label>
                      <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-semibold text-secondary sm:grid-cols-1 sm:gap-1 sm:text-center">
                        <span>어시스트</span>
                        <input type="number" min="0" max="99" value={statistic.assistCount} onChange={(event) => updatePlayerStatistic(member.id, "assistCount", event.target.valueAsNumber)} disabled={isSaving} className="h-9 min-w-0 rounded-lg border border-line-strong bg-white px-2 text-center text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed" />
                      </label>
                      <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-semibold text-secondary sm:grid-cols-1 sm:gap-1 sm:text-center">
                        <span>클린시트</span>
                        <input type="number" min="0" max="99" value={statistic.cleanSheetCount} onChange={(event) => updatePlayerStatistic(member.id, "cleanSheetCount", event.target.valueAsNumber)} disabled={isSaving} className="h-9 min-w-0 rounded-lg border border-line-strong bg-white px-2 text-center text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed" />
                      </label>
                    </div>
                  );
                })}
                {isInternal ? <div className="divide-y divide-line bg-canvas">
                  {([{ side: "홈", goals: unknownGoalCount, assists: unknownAssistCount, setGoals: setUnknownGoalCount, setAssists: setUnknownAssistCount },
                    { side: "어웨이", goals: awayUnknownGoalCount, assists: awayUnknownAssistCount, setGoals: setAwayUnknownGoalCount, setAssists: setAwayUnknownAssistCount }]).map(row => <div key={row.side} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_6rem_6rem] sm:px-6">
                    <p className="text-sm font-semibold text-ink">{row.side} · 선수를 알 수 없는 기록</p>
                    <label className="grid gap-1 text-sm text-secondary">미상 골<input className="field w-full" aria-label={`${row.side} 미상 골`} type="number" min={0} max={99} value={row.goals} disabled={isSaving} onChange={event => row.setGoals(normalizeCount(event.target.valueAsNumber))} /></label>
                    <label className="grid gap-1 text-sm text-secondary">미상 어시스트<input className="field w-full" aria-label={`${row.side} 미상 어시스트`} type="number" min={0} max={99} value={row.assists} disabled={isSaving} onChange={event => row.setAssists(normalizeCount(event.target.valueAsNumber))} /></label>
                  </div>)}
                </div> : <div className="grid gap-3 bg-canvas px-5 py-4 lg:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_5rem_5rem_6rem] lg:items-center sm:px-6">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">알 수 없음</p>
                    <p className="mt-1 text-xs text-muted">명단 외 용병 또는 선수를 특정할 수 없는 기록</p>
                  </div>
                  <p className="text-sm text-muted lg:col-span-2 lg:text-center">개인 기록 미상</p>
                  <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-semibold text-secondary sm:grid-cols-1 sm:gap-1 sm:text-center">
                    <span>골</span>
                    <input type="number" min="0" max="99" value={unknownGoalCount} onChange={(event) => setUnknownGoalCount(normalizeCount(event.target.valueAsNumber))} disabled={isSaving} aria-label="알 수 없는 골" className="h-9 min-w-0 rounded-lg border border-line-strong bg-white px-2 text-center text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed" />
                  </label>
                  <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-sm font-semibold text-secondary sm:grid-cols-1 sm:gap-1 sm:text-center">
                    <span>어시스트</span>
                    <input type="number" min="0" max="99" value={unknownAssistCount} onChange={(event) => setUnknownAssistCount(normalizeCount(event.target.valueAsNumber))} disabled={isSaving} aria-label="알 수 없는 어시스트" className="h-9 min-w-0 rounded-lg border border-line-strong bg-white px-2 text-center text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed" />
                  </label>
                  <p className="text-sm text-placeholder lg:text-center">-</p>
                </div>}
              </div>
              <div className="flex justify-end border-t border-line bg-canvas px-5 py-4 sm:px-6">
                <button type="button" onClick={() => void saveMatchRecord()} disabled={isSaving || invalidRecord || versionConflict} className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-brand-disabled">
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
