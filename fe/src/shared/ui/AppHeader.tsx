"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { getMatch } from "@/features/match/api/match";

const teamHomeClassName = "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#edf3fa] px-2.5 text-sm font-semibold text-[#2f4d76] transition-colors hover:bg-[#e1eaf6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6f9f] sm:px-4";

function TeamHomeLabel() {
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="hidden size-4 shrink-0 sm:block">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3 10 9-7 9 7M5 9v11h5v-6h4v6h5V9" />
      </svg>
      <span className="whitespace-nowrap">팀 홈</span>
    </>
  );
}

function TeamHomeLink({ teamId, isCurrent = false }: { teamId: number; isCurrent?: boolean }) {
  return (
    <Link href={`/team/${teamId}`} aria-current={isCurrent ? "page" : undefined} title="현재 팀의 홈으로 이동" className={teamHomeClassName}>
      <TeamHomeLabel />
    </Link>
  );
}

// Match routes do not contain a team ID. Resolve the owning team for direct visits too.
function MatchTeamHomeLink({ matchId, canLoad }: { matchId: number; canLoad: boolean }) {
  const [teamId, setTeamId] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!canLoad) return;
    let active = true;
    async function loadTeamId() {
      try {
        const response = await getMatch(matchId);
        if (!response.data) throw new Error("매치 정보를 받지 못했습니다.");
        if (active) setTeamId(response.data.teamId);
      } catch {
        if (active) setHasError(true);
      }
    }
    void loadTeamId();
    return () => { active = false; };
  }, [matchId, canLoad, attempt]);

  if (teamId !== null) return <TeamHomeLink teamId={teamId} />;
  if (hasError) {
    return (
      <button type="button" className={teamHomeClassName} aria-label="팀 홈 연결 다시 시도" title="팀 정보를 불러오지 못했습니다. 눌러서 다시 시도하세요." onClick={() => { setHasError(false); setAttempt((value) => value + 1); }}>
        다시 시도
      </button>
    );
  }
  return (
    <span aria-disabled="true" aria-busy={canLoad} title={canLoad ? "현재 팀을 확인하고 있습니다." : "로그인 후 팀 홈으로 이동할 수 있습니다."} className={`${teamHomeClassName} opacity-50`}>
      <TeamHomeLabel />
    </span>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const params = useParams<{ teamId?: string; matchId?: string }>();
  const router = useRouter();
  const { currentUser, isSessionReady, endSession } = useAuthSession();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const teamId = Number(params.teamId);
  const matchId = Number(params.matchId);
  const isTeamPage = Number.isSafeInteger(teamId) && teamId > 0;
  const isMatchPage = Number.isSafeInteger(matchId) && matchId > 0;
  const hasTeamContext = isTeamPage || isMatchPage;

  async function handleSignOut() {
    setIsAccountMenuOpen(false);

    try {
      await endSession();
    } finally {
      router.replace("/");
    }
  }

  return (
    <header className="app-header sticky top-0 z-30 border-b border-[#dbe4f0] bg-white/95 backdrop-blur">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link href="/" aria-label="Team Manager 시작 페이지" className="flex min-w-0 items-center gap-3">
          <Image
            src="/team-manager-logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="size-9 shrink-0"
          />
          <span className="hidden truncate text-base font-semibold lg:block">Team Manager</span>
        </Link>

        <nav aria-label="주요 메뉴" className="flex min-w-0 items-center justify-center gap-1 sm:gap-2">
          {isTeamPage ? (
            <TeamHomeLink teamId={teamId} isCurrent={pathname === `/team/${teamId}`} />
          ) : isMatchPage ? (
            <MatchTeamHomeLink key={`${matchId}-${currentUser?.id ?? "anonymous"}`} matchId={matchId} canLoad={isSessionReady && currentUser !== null} />
          ) : null}
          <Link
            href="/team"
            aria-label="전체 팀 목록"
            aria-current={pathname === "/team" ? "page" : undefined}
            className={`inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6f9f] sm:px-3 sm:text-sm ${
              hasTeamContext
                ? "text-xs text-[#64748b] hover:bg-[#f0f4fa] hover:text-[#2f4d76]"
                : pathname === "/team"
                  ? "bg-[#edf3fa] text-sm text-[#2f4d76]"
                  : "text-sm text-[#52627b] hover:bg-[#f0f4fa] hover:text-[#2f4d76]"
            }`}
          >
            <span className="sm:hidden">팀 목록</span>
            <span className="hidden sm:inline">전체 팀 목록</span>
          </Link>
          <Link
            href="/guide"
            aria-current={pathname === "/guide" ? "page" : undefined}
            className={`inline-flex h-10 shrink-0 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f6f9f] sm:px-3 sm:text-sm ${
              pathname === "/guide"
                ? "bg-[#edf3fa] text-[#2f4d76]"
                : "text-[#64748b] hover:bg-[#f0f4fa] hover:text-[#2f4d76]"
            }`}
          >
            가이드
          </Link>
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2">
          {currentUser ? (
            <div className="relative min-w-0">
              <button
                type="button"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                className="inline-flex h-10 max-w-16 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-2 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] sm:max-w-36 sm:px-3"
              >
                <span className="truncate">{currentUser.username}</span>
              </button>

              {isAccountMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-40 w-44 border border-[#dbe4f0] bg-white p-1 shadow-[0_12px_30px_rgba(15,23,42,0.14)]"
                >
                  <p className="px-3 py-2 text-xs font-semibold text-[#64748b]">
                    {currentUser.username}
                  </p>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex h-10 w-full items-center rounded-sm px-3 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#f0f4fa]"
                  >
                    프로필
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSignOut()}
                    className="flex h-10 w-full items-center rounded-sm px-3 text-left text-sm font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2]"
                  >
                    로그아웃
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] sm:px-4"
              >
                로그인
              </Link>
              <Link
                href="/sign-up"
                className="hidden h-10 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] sm:inline-flex"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
