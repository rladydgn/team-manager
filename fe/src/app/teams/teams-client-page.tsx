"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import { createTeam, getTeams, joinTeam, Team } from "@/features/team/api/team";

function cleanOptionalValue(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

type TeamsPageProps = {
  initialTeams: Team[];
  initialLoadError: string | null;
};

export default function TeamsClientPage({
  initialTeams,
  initialLoadError,
}: TeamsPageProps) {
  const currentUser = useCurrentUser();
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [searchText, setSearchText] = useState("");
  const [teamName, setTeamName] = useState("");
  const [shortName, setShortName] = useState("");
  const [foundedAt, setFoundedAt] = useState("");
  const [region, setRegion] = useState("");
  const [homeStadium, setHomeStadium] = useState("");
  const [description, setDescription] = useState("");
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTeamLoadError, setHasTeamLoadError] = useState(initialLoadError !== null);
  const [isCreating, setIsCreating] = useState(false);
  const [joiningTeamId, setJoiningTeamId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setHasTeamLoadError(false);
    setErrorMessage("");

    try {
      const response = await getTeams();
      setTeams(response.data ?? []);
    } catch (error) {
      setHasTeamLoadError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "팀 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredTeams = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {
      return teams;
    }

    return teams.filter((team) =>
      [
        team.name,
        team.shortName,
        team.region,
        team.homeStadium,
        team.description,
      ].some((value) => value?.toLowerCase().includes(keyword))
    );
  }, [searchText, teams]);

  const shouldShowCreateForm = teams.length === 0 || isCreatePanelOpen;

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNoticeMessage("");

    if (!currentUser) {
      setErrorMessage("팀을 생성하려면 먼저 로그인해 주세요.");
      return;
    }

    setIsCreating(true);

    try {
      const response = await createTeam({
        name: teamName.trim(),
        shortName: cleanOptionalValue(shortName),
        foundedAt: foundedAt || undefined,
        region: cleanOptionalValue(region),
        homeStadium: cleanOptionalValue(homeStadium),
        description: cleanOptionalValue(description),
      });

      setTeamName("");
      setShortName("");
      setFoundedAt("");
      setRegion("");
      setHomeStadium("");
      setDescription("");
      setSearchText("");
      setIsCreatePanelOpen(false);
      setNoticeMessage(
        response.data
          ? `${response.data.name} 팀이 생성되었습니다.`
          : "팀이 생성되었습니다."
      );
      await loadTeams();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀을 생성하지 못했습니다."
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinTeam(teamId: number, teamNameValue: string) {
    setErrorMessage("");
    setNoticeMessage("");

    if (!currentUser) {
      setErrorMessage("팀에 가입하려면 먼저 로그인해 주세요.");
      return;
    }

    setJoiningTeamId(teamId);

    try {
      await joinTeam(teamId);
      setNoticeMessage(`${teamNameValue} 팀 가입 신청이 완료되었습니다.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀 가입에 실패했습니다."
      );
    } finally {
      setJoiningTeamId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header data-legacy-page-header className="border-b border-[#dbe4f0] bg-white/90">
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
              {currentUser.username}
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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#4f6f9f]">
              팀 관리 화면
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-[#0f172a] sm:text-4xl">
              내 팀을 만들거나 가입할 팀을 찾아보세요.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b] sm:text-base">
              팀 생성 후 팀원, 경기 일정, 경기 기록, 회비 관리를 이어서 사용할
              수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatePanelOpen((value) => !value)}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#435f88]"
          >
            {shouldShowCreateForm ? "생성 폼 닫기" : "팀 생성"}
          </button>
        </section>

        {!currentUser ? (
          <section className="rounded-lg border border-[#dbe4f0] bg-white px-5 py-4 text-sm leading-6 text-[#64748b]">
            팀 생성과 가입은 로그인 후 사용할 수 있습니다.{" "}
            <Link href="/login" className="font-semibold text-[#3d5b86]">
              로그인하러 가기
            </Link>
          </section>
        ) : null}

        <section className="rounded-lg border border-[#dbe4f0] bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-5">
          <label className="grid gap-2 text-sm font-semibold text-[#1f2937]">
            팀 검색
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
              placeholder="팀 이름, 지역, 홈 구장으로 검색"
            />
          </label>
        </section>

        {errorMessage && !hasTeamLoadError ? (
          <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
            {errorMessage}
          </p>
        ) : null}

        {noticeMessage ? (
          <p className="rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-4 py-3 text-sm font-medium text-[#3d5b86]">
            {noticeMessage}
          </p>
        ) : null}

        {shouldShowCreateForm ? (
          <section className="rounded-lg border border-[#dbe4f0] bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold tracking-normal text-[#0f172a]">
                새 팀 생성
              </h2>
              <p className="text-sm leading-6 text-[#64748b]">
                필수 정보는 팀 이름뿐입니다. 세부 정보는 나중에 팀 설정에서
                보완할 수 있습니다.
              </p>
            </div>

            <form className="mt-6 grid gap-5" onSubmit={handleCreateTeam}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  팀 이름
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    placeholder="우리 FC"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  짧은 이름
                  <input
                    value={shortName}
                    onChange={(event) => setShortName(event.target.value)}
                    className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    placeholder="WFC"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  창단일
                  <input
                    value={foundedAt}
                    onChange={(event) => setFoundedAt(event.target.value)}
                    className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  활동 지역
                  <input
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    placeholder="서울"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  홈 구장
                  <input
                    value={homeStadium}
                    onChange={(event) => setHomeStadium(event.target.value)}
                    className="h-12 rounded-md border border-[#cbd5e1] bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                    placeholder="잠실 풋살장"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                팀 소개
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 resize-y rounded-md border border-[#cbd5e1] bg-white px-4 py-3 text-base font-normal leading-7 outline-none transition-colors placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]"
                  placeholder="주말마다 함께 공을 차는 팀입니다."
                />
              </label>

              <button
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-base font-semibold text-white transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#a9b9d3]"
                type="submit"
                disabled={isCreating || !teamName.trim() || !currentUser}
              >
                {isCreating ? "생성 중..." : "팀 생성하기"}
              </button>
            </form>
          </section>
        ) : null}

        {hasTeamLoadError ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h2 className="text-xl font-bold text-[#0f172a]">팀 목록을 불러올 수 없습니다.</h2>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">
              {errorMessage || initialLoadError || "잠시 후 다시 시도해 주세요."}
            </p>
            <button
              type="button"
              onClick={() => void loadTeams()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              다시 시도
            </button>
          </section>
        ) : isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">
              팀 목록을 불러오는 중입니다.
            </p>
          </section>
        ) : teams.length === 0 ? (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-[#c8d4e6] bg-white px-5 py-12 text-center">
            <div className="max-w-md">
              <p className="text-sm font-semibold text-[#4f6f9f]">
                아직 등록된 팀이 없습니다
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-normal text-[#0f172a]">
                팀을 생성하거나, 나중에 검색해서 가입할 수 있어요.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#64748b]">
                첫 팀을 만들면 팀원 관리와 경기 일정 관리를 바로 시작할 수
                있습니다.
              </p>
            </div>
          </section>
        ) : filteredTeams.length === 0 ? (
          <section className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-[#c8d4e6] bg-white px-5 py-12 text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-bold tracking-normal text-[#0f172a]">
                검색 결과가 없습니다.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#64748b]">
                검색어를 줄이거나, 원하는 팀이 없다면 새 팀을 생성해 주세요.
              </p>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTeams.map((team) => {
              const isOwner = currentUser?.id === team.createdByUserId;

              return (
                <article
                  key={team.id}
                  className="flex min-h-64 flex-col rounded-lg border border-[#dbe4f0] bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-normal text-[#4f6f9f]">
                        {team.shortName || "TEAM"}
                      </p>
                      <h2 className="mt-2 truncate text-xl font-bold tracking-normal text-[#0f172a]">
                        {team.name}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-md border border-[#c8d4e6] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                      {team.status}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 min-h-16 text-sm leading-6 text-[#64748b]">
                    {team.description || "아직 팀 소개가 등록되지 않았습니다."}
                  </p>

                  <dl className="mt-5 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3 rounded-md bg-[#f8fafc] px-3 py-2">
                      <dt className="font-semibold text-[#64748b]">지역</dt>
                      <dd className="truncate font-semibold text-[#1f2937]">
                        {team.region || "미등록"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md bg-[#f8fafc] px-3 py-2">
                      <dt className="font-semibold text-[#64748b]">홈 구장</dt>
                      <dd className="truncate font-semibold text-[#1f2937]">
                        {team.homeStadium || "미등록"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md bg-[#f8fafc] px-3 py-2">
                      <dt className="font-semibold text-[#64748b]">등록일</dt>
                      <dd className="truncate font-semibold text-[#1f2937]">
                        {formatDate(team.createdAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link
                      href={`/teams/${team.id}`}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
                    >
                      상세 보기
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleJoinTeam(team.id, team.name)}
                      disabled={!currentUser || isOwner || joiningTeamId === team.id}
                      className="inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#e1e8f2] disabled:text-[#52627b]"
                    >
                      {joiningTeamId === team.id
                        ? "신청 중..."
                        : isOwner
                          ? "내가 만든 팀"
                          : "가입 신청"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
