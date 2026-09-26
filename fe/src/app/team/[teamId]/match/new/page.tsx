"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createMatch, MatchType } from "@/features/match/api/match";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import { getTeam, TeamDetail } from "@/features/team/api/team";

const matchTypes: { value: MatchType; label: string }[] = [
  { value: "EXTERNAL", label: "외부전" },
  { value: "INTERNAL", label: "자체전" },
];

function cleanOptionalValue(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function toDateTimeLocalValue(value: Date) {
  const localValue = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);

  return localValue.toISOString().slice(0, 16);
}

function getDefaultParticipationDeadline(matchAt: string) {
  const matchDate = new Date(matchAt);

  if (Number.isNaN(matchDate.getTime())) {
    return "";
  }

  matchDate.setHours(matchDate.getHours() - 24);
  return toDateTimeLocalValue(matchDate);
}

export default function NewMatchPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = Number(params.teamId);
  const currentUser = useCurrentUser();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [matchType, setMatchType] = useState<MatchType>("EXTERNAL");
  const [isTraining, setIsTraining] = useState(false);
  const [opponentTeamName, setOpponentTeamName] = useState("");
  const [matchAt, setMatchAt] = useState("");
  const [participationDeadlineAt, setParticipationDeadlineAt] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

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
      setTeamDetail(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "팀 정보를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadTeam();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadTeam]);

  const currentMember = useMemo(
    () =>
      teamDetail?.members.find((member) => member.userId === currentUser?.id),
    [currentUser?.id, teamDetail?.members],
  );
  const canCreateMatch =
    currentMember?.role === "OWNER" || currentMember?.role === "SUB_MANAGER";

  function handleMatchTypeChange(nextMatchType: MatchType) {
    setMatchType(nextMatchType);

    if (nextMatchType === "INTERNAL") {
      setOpponentTeamName("");
    }
  }

  function handleMatchAtChange(value: string) {
    setMatchAt(value);
    setParticipationDeadlineAt(getDefaultParticipationDeadline(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNoticeMessage("");

    if (!teamDetail || !canCreateMatch) {
      setErrorMessage("경기를 등록할 권한이 없습니다.");
      return;
    }

    if (
      new Date(participationDeadlineAt).getTime() >
      new Date(matchAt).getTime()
    ) {
      setErrorMessage("투표 마감일은 경기 일시보다 늦을 수 없습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createMatch({
        teamId: teamDetail.team.id,
        matchType,
        isTraining,
        opponentTeamName:
          matchType === "EXTERNAL"
            ? cleanOptionalValue(opponentTeamName)
            : undefined,
        matchAt,
        participationDeadlineAt,
        location: cleanOptionalValue(location),
      });

      if (!response.data) {
        throw new Error("생성된 경기 정보를 받지 못했습니다.");
      }

      router.replace(`/match/${response.data.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "경기를 등록하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href={
            Number.isInteger(teamId) && teamId > 0
              ? `/team/${teamId}`
              : "/team"
          }
          className="inline-flex w-fit text-sm font-semibold text-brand-ink transition-colors hover:text-brand-hover"
        >
          팀 홈으로 돌아가기
        </Link>

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">
              팀 정보를 불러오는 중입니다.
            </p>
          </section>
        ) : errorMessage && !teamDetail ? (
          <section className="rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">
              경기 등록 화면을 열 수 없습니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-danger">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => void loadTeam()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              다시 시도
            </button>
          </section>
        ) : !currentUser ? (
          <section className="rounded-xl border border-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">
              로그인이 필요합니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              경기 등록은 팀 운영진만 할 수 있습니다.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              로그인
            </Link>
          </section>
        ) : !canCreateMatch ? (
          <section className="rounded-xl border border-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">
              경기 등록 권한이 없습니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              운영진만 경기를 등록할 수 있습니다.
            </p>
          </section>
        ) : teamDetail ? (
          <section className="rounded-xl border border-line bg-white shadow-card">
            <div className="border-b border-line bg-subtle px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold text-brand">
                경기 일정 등록
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-ink sm:text-3xl">
                경기 등록
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold text-muted">우리 팀</span>
                <strong className="text-base text-ink">
                  {teamDetail.team.name}
                </strong>
                <span className="rounded-lg border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-brand-ink">
                  HOME
                </span>
              </div>
            </div>

            <form className="grid gap-6 p-5 sm:p-7" onSubmit={handleSubmit}>
              <fieldset className="grid gap-3">
                <legend className="text-sm font-semibold">매치 유형</legend>
                <div className="grid grid-cols-2 rounded-lg border border-line-strong bg-subtle p-1">
                  {matchTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleMatchTypeChange(type.value)}
                      className={`h-10 rounded-sm text-sm font-semibold transition-colors ${
                        matchType === type.value
                          ? "bg-brand text-white shadow-sm"
                          : "text-secondary hover:bg-white"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-subtle px-4 py-3 text-sm font-semibold text-secondary">
                <input type="checkbox" checked={isTraining} onChange={(event) => setIsTraining(event.target.checked)} className="size-4 accent-brand" />
                훈련으로 등록
                <span className="font-normal text-muted">경기 출석에 포함되며, 훈련 출석도 따로 표시됩니다.</span>
              </label>

              {matchType === "EXTERNAL" ? (
                <label className="grid gap-2 text-sm font-semibold">
                  상대 팀명
                  <input
                    value={opponentTeamName}
                    onChange={(event) =>
                      setOpponentTeamName(event.target.value)
                    }
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    placeholder="강남 FC"
                    maxLength={100}
                    required
                  />
                </label>
              ) : (
                <p className="border-l-2 border-[#8ca4c7] bg-subtle px-4 py-3 text-sm leading-6 text-secondary">
                  자체전은 우리 팀원을 두 팀으로 나누어 진행합니다.
                </p>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  경기 일시
                  <input
                    value={matchAt}
                    onChange={(event) => handleMatchAtChange(event.target.value)}
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    type="datetime-local"
                    step={600}
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  투표 마감일
                  <input
                    value={participationDeadlineAt}
                    onChange={(event) =>
                      setParticipationDeadlineAt(event.target.value)
                    }
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    type="datetime-local"
                    step={600}
                    max={matchAt || undefined}
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  경기 장소
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    placeholder="잠실 풋살장"
                    maxLength={255}
                  />
                </label>
              </div>

              {errorMessage ? (
                <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                  {errorMessage}
                </p>
              ) : null}

              {noticeMessage ? (
                <p className="rounded-lg border border-line-strong bg-brand-soft px-4 py-3 text-sm font-medium text-brand-ink">
                  {noticeMessage}
                </p>
              ) : null}

              <button
                className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-5 text-base font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-brand-disabled"
                type="submit"
                disabled={
                  isSubmitting ||
                  !matchAt ||
                  !participationDeadlineAt ||
                  (matchType === "EXTERNAL" && !opponentTeamName.trim())
                }
              >
                {isSubmitting ? "등록 중..." : "경기 등록"}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}
