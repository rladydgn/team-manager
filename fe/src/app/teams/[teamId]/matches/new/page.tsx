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

export default function NewMatchPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = Number(params.teamId);
  const currentUser = useCurrentUser();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [matchType, setMatchType] = useState<MatchType>("EXTERNAL");
  const [opponentTeamName, setOpponentTeamName] = useState("");
  const [matchAt, setMatchAt] = useState("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNoticeMessage("");

    if (!teamDetail || !canCreateMatch) {
      setErrorMessage("매치를 생성할 권한이 없습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createMatch({
        teamId: teamDetail.team.id,
        matchType,
        opponentTeamName:
          matchType === "EXTERNAL"
            ? cleanOptionalValue(opponentTeamName)
            : undefined,
        matchAt,
        location: cleanOptionalValue(location),
      });

      if (!response.data) {
        throw new Error("생성된 매치 정보를 받지 못했습니다.");
      }

      router.replace(`/matches/${response.data.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "매치를 등록하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header
        data-legacy-page-header
        className="border-b border-[#dbe4f0] bg-white/90"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href={
            Number.isInteger(teamId) && teamId > 0
              ? `/teams/${teamId}`
              : "/teams"
          }
          className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]"
        >
          팀 상세로 돌아가기
        </Link>

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">
              팀 정보를 불러오는 중입니다.
            </p>
          </section>
        ) : errorMessage && !teamDetail ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">
              매치 생성 화면을 열 수 없습니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => void loadTeam()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              다시 시도
            </button>
          </section>
        ) : !currentUser ? (
          <section className="rounded-lg border border-[#dbe4f0] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">
              로그인이 필요합니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">
              매치 생성은 팀 운영진만 할 수 있습니다.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              로그인
            </Link>
          </section>
        ) : !canCreateMatch ? (
          <section className="rounded-lg border border-[#dbe4f0] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">
              매치 생성 권한이 없습니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">
              팀장과 부관리자만 매치를 등록할 수 있습니다.
            </p>
          </section>
        ) : teamDetail ? (
          <section className="rounded-lg border border-[#dbe4f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="border-b border-[#e5eaf3] bg-[#f8fafc] px-5 py-5 sm:px-7">
              <p className="text-sm font-semibold text-[#4f6f9f]">
                경기 일정 등록
              </p>
              <h1 className="mt-2 text-2xl font-bold text-[#0f172a] sm:text-3xl">
                매치 생성
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold text-[#64748b]">우리 팀</span>
                <strong className="text-base text-[#1f2937]">
                  {teamDetail.team.name}
                </strong>
                <span className="rounded-md border border-[#b9c9df] bg-white px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                  HOME
                </span>
              </div>
            </div>

            <form className="grid gap-6 p-5 sm:p-7" onSubmit={handleSubmit}>
              <fieldset className="grid gap-3">
                <legend className="text-sm font-semibold">매치 유형</legend>
                <div className="grid grid-cols-2 rounded-md border border-[#cbd5e1] bg-[#f8fafc] p-1">
                  {matchTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleMatchTypeChange(type.value)}
                      className={`h-10 rounded-sm text-sm font-semibold transition-colors ${
                        matchType === type.value
                          ? "bg-[#4f6f9f] text-white shadow-sm"
                          : "text-[#52627b] hover:bg-white"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {matchType === "EXTERNAL" ? (
                <label className="grid gap-2 text-sm font-semibold">
                  상대 팀명
                  <input
                    value={opponentTeamName}
                    onChange={(event) =>
                      setOpponentTeamName(event.target.value)
                    }
                    className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    placeholder="강남 FC"
                    maxLength={100}
                    required
                  />
                </label>
              ) : (
                <p className="border-l-2 border-[#8ca4c7] bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-[#52627b]">
                  자체전은 우리 팀원을 두 팀으로 나누어 진행합니다.
                </p>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  경기 일시
                  <input
                    value={matchAt}
                    onChange={(event) => setMatchAt(event.target.value)}
                    className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    type="datetime-local"
                    step={600}
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  경기 장소
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    placeholder="잠실 풋살장"
                    maxLength={255}
                  />
                </label>
              </div>

              {errorMessage ? (
                <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
                  {errorMessage}
                </p>
              ) : null}

              {noticeMessage ? (
                <p className="rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-4 py-3 text-sm font-medium text-[#3d5b86]">
                  {noticeMessage}
                </p>
              ) : null}

              <button
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-base font-semibold text-white transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#a9b9d3]"
                type="submit"
                disabled={
                  isSubmitting ||
                  !matchAt ||
                  (matchType === "EXTERNAL" && !opponentTeamName.trim())
                }
              >
                {isSubmitting ? "등록 중..." : "매치 등록"}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}
