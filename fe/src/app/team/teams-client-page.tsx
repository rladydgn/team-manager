"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Icon } from "@/shared/ui/Icon";
import { PageHeading } from "@/shared/ui/PageHeading";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import { createTeam, getTeams, joinTeam, Team } from "@/features/team/api/team";

function cleanOptionalValue(value: string) {
  const trimmed = value.trim();

  return trimmed || undefined;
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
  const [teamFilter, setTeamFilter] = useState<"all" | "mine">("all");
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

    const visibleTeams = teamFilter === "mine" ? teams.filter((team) => team.membershipStatus === "ACTIVE") : teams;
    if (!keyword) return visibleTeams;
    return visibleTeams.filter((team) =>
      [
        team.name,
        team.shortName,
        team.region,
        team.homeStadium,
        team.description,
      ].some((value) => value?.toLowerCase().includes(keyword))
    );
  }, [searchText, teams, teamFilter]);

  const shouldShowCreateForm = Boolean(currentUser) && isCreatePanelOpen;

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
      setTeamFilter("all");
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
      const response = await joinTeam(teamId);
      setTeams((currentTeams) =>
        currentTeams.map((team) =>
          team.id === teamId
            ? { ...team, membershipStatus: response.data?.status ?? "PENDING" }
            : team
        )
      );
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
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">

      <div className="page-shell">
        <PageHeading label="함께 뛰는 팀" title="팀" description="내 팀으로 이동하거나 함께할 팀을 찾아보세요." action={currentUser ? (
          <button type="button" aria-expanded={shouldShowCreateForm} aria-controls="create-team-panel" onClick={() => setIsCreatePanelOpen((value) => !value)} className={shouldShowCreateForm ? "btn-secondary" : "btn-primary"}>
            <Icon name={shouldShowCreateForm ? "close" : "plus"} />{shouldShowCreateForm ? "닫기" : "새 팀 만들기"}
          </button>
        ) : <Link href="/login" className="btn-primary">로그인하고 시작하기 <Icon name="arrow" /></Link>} />
        <section aria-label="팀 검색 및 필터" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-fit rounded-lg bg-subtle p-1" aria-label="팀 범위">
            <button type="button" aria-pressed={teamFilter === "all"} onClick={() => setTeamFilter("all")} className={`min-h-10 rounded-md px-4 text-sm font-medium transition-colors ${teamFilter === "all" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>전체 팀</button>
            {currentUser ? <button type="button" aria-pressed={teamFilter === "mine"} onClick={() => setTeamFilter("mine")} className={`min-h-10 rounded-md px-4 text-sm font-medium transition-colors ${teamFilter === "mine" ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}>내 팀 <span className="ml-1 text-muted">{teams.filter((team) => team.membershipStatus === "ACTIVE").length}</span></button> : null}
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-muted" />
            <input aria-label="팀 검색" type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} className="field pl-10" placeholder="팀 이름, 지역, 구장 검색" />
          </div>
        </section>

        {errorMessage && !hasTeamLoadError ? (
          <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {errorMessage}
          </p>
        ) : null}

        {noticeMessage ? (
          <p className="rounded-lg border border-line-strong bg-brand-soft px-4 py-3 text-sm font-medium text-brand-ink">
            {noticeMessage}
          </p>
        ) : null}

        {shouldShowCreateForm ? (
          <section id="create-team-panel" className="surface-card p-5 sm:p-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                새 팀 만들기
              </h2>
              <p className="text-sm leading-6 text-muted">
                팀 이름만 입력해도 시작할 수 있어요. 나머지 정보는 나중에 추가하세요.
              </p>
            </div>

            <form className="mt-6 grid gap-5" onSubmit={handleCreateTeam}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  팀 이름
                  <input
                    value={teamName}
                    onChange={(event) => setTeamName(event.target.value)}
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    placeholder="우리 FC"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  팀 약칭
                  <input
                    value={shortName}
                    onChange={(event) => setShortName(event.target.value)}
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    placeholder="WFC"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  창단일
                  <input
                    value={foundedAt}
                    onChange={(event) => setFoundedAt(event.target.value)}
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  활동 지역
                  <input
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    placeholder="서울"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold">
                  홈 구장
                  <input
                    value={homeStadium}
                    onChange={(event) => setHomeStadium(event.target.value)}
                    className="h-12 rounded-lg border border-line-strong bg-white px-4 text-base font-normal outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                    placeholder="잠실 풋살장"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                팀 소개
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-28 resize-y rounded-lg border border-line-strong bg-white px-4 py-3 text-base font-normal leading-7 outline-none transition-colors placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand-ring"
                  placeholder="주말마다 함께 공을 차는 팀입니다."
                />
              </label>

              <button
                className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-5 text-base font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-brand-disabled"
                type="submit"
                disabled={isCreating || !teamName.trim() || !currentUser}
              >
                {isCreating ? "생성 중..." : "팀 만들기"}
              </button>
            </form>
          </section>
        ) : null}

        {hasTeamLoadError ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h2 className="text-xl font-semibold text-ink">팀 목록을 불러올 수 없습니다.</h2>
            <p className="mt-3 text-sm leading-6 text-danger">
              {errorMessage || initialLoadError || "잠시 후 다시 시도해 주세요."}
            </p>
            <button
              type="button"
              onClick={() => void loadTeams()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              다시 시도
            </button>
          </section>
        ) : isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">
              팀 목록을 불러오는 중입니다.
            </p>
          </section>
        ) : teams.length === 0 ? (
          <section className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-line-strong bg-white px-5 py-12 text-center">
            <div className="max-w-md">
              <p className="text-sm font-semibold text-brand">
                아직 등록된 팀이 없습니다
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                첫 번째 팀을 만들어보세요
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                팀을 만들고 함께할 팀원을 초대해 보세요.
              </p>
            </div>
          </section>
        ) : filteredTeams.length === 0 ? (
          <section className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-line-strong bg-white px-5 py-12 text-center">
            <div className="max-w-md">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {teamFilter === "mine" && !searchText ? "아직 가입한 팀이 없습니다" : "검색 결과가 없습니다"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                검색어를 바꾸거나 전체 팀에서 찾아보세요.
              </p>
            </div>
          </section>
        ) : (
          <section aria-label="팀 목록" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTeams.map((team) => {
              const isOwner = currentUser?.id === team.createdByUserId;
              const isJoinRequestPending = team.membershipStatus === "PENDING";
              const hasJoinedTeam = team.membershipStatus === "ACTIVE";
              const isJoinForbidden = team.membershipStatus === "BANNED";
              const isJoinDisabled =
                !currentUser ||
                isOwner ||
                isJoinRequestPending ||
                hasJoinedTeam ||
                isJoinForbidden ||
                joiningTeamId === team.id;

              return (
                <article
                  key={team.id}
                  className="surface-card flex flex-col p-5 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-tight text-brand">
                        {team.shortName || "우리 팀"}
                      </p>
                      <h2 className="mt-2 truncate text-xl font-semibold tracking-tight text-ink">
                        <Link href={`/team/${team.id}`} className="hover:text-brand">{team.name}</Link>
                      </h2>
                    </div>
                    <span className={`status-badge shrink-0 ${hasJoinedTeam ? "bg-brand-soft text-brand-ink" : ""}`}>
                      {hasJoinedTeam ? "내 팀" : team.status === "ACTIVE" ? "활동 중" : "비활성"}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-muted">
                    {team.description || "등록된 팀 소개가 없습니다."}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line pt-4 text-xs text-muted">
                    <Icon name="location" className="size-3.5" /><span>{team.region || "지역 미등록"}</span>
                    {team.homeStadium ? <><span aria-hidden="true">·</span><span className="truncate">{team.homeStadium}</span></> : null}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link
                      href={`/team/${team.id}`}
                      className={hasJoinedTeam ? "btn-primary col-span-2" : "btn-secondary"}
                    >
                      팀 홈 <Icon name="arrow" />
                    </Link>
                    {!hasJoinedTeam ? (
                    <button
                      type="button"
                      onClick={() => void handleJoinTeam(team.id, team.name)}
                      disabled={isJoinDisabled}
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-subtle disabled:text-secondary"
                    >
                      {joiningTeamId === team.id
                        ? "신청 중..."
                        : isOwner
                          ? "가입 완료"
                          : isJoinRequestPending
                            ? "승인 대기"
                            : hasJoinedTeam
                              ? "가입 완료"
                              : isJoinForbidden
                                ? "가입 불가"
                                : "가입 신청"}
                    </button>
                    ) : null}
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
