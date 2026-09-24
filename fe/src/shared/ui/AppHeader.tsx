"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { Icon } from "@/shared/ui/Icon";
import { getMatch } from "@/features/match/api/match";

const teamHomeClassName = "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-soft px-2.5 text-xs font-semibold text-brand-ink transition-colors hover:bg-brand-ring sm:px-3 sm:text-sm";

function TeamHomeLabel() {
  return <><Icon name="home" className="hidden size-4 sm:block" /><span className="whitespace-nowrap">팀 홈</span></>;
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
        if (!response.data) throw new Error("경기 정보를 받지 못했습니다.");
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
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isAccountMenuOpen) return;
    function closeOutside(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) setIsAccountMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen]);
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
    <header className="app-header sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">본문으로 건너뛰기</a>
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link href="/" aria-label="Team Manager 홈" className="flex w-fit min-w-0 items-center gap-2.5 rounded-lg">
          <Image src="/team-manager-logo.png" alt="" width={40} height={40} priority unoptimized className="size-10 shrink-0" />
          <span className="hidden text-sm font-semibold tracking-tight lg:block">Team Manager</span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex min-w-0 items-center justify-center gap-0.5 sm:gap-1">
          {isTeamPage ? <TeamHomeLink teamId={teamId} isCurrent={pathname === `/team/${teamId}`} /> : isMatchPage ? <MatchTeamHomeLink key={`${matchId}-${currentUser?.id ?? "anonymous"}`} matchId={matchId} canLoad={isSessionReady && currentUser !== null} /> : null}
          <Link href="/team" aria-label="전체 팀 목록" aria-current={pathname === "/team" ? "page" : undefined}
            className={`inline-flex h-10 shrink-0 items-center rounded-lg px-2.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${pathname === "/team" ? "bg-subtle text-ink" : "text-muted hover:bg-subtle hover:text-ink"}`}>
            {hasTeamContext ? "팀 목록" : "팀"}
          </Link>
          <Link href="/guide" aria-current={pathname === "/guide" ? "page" : undefined}
            className={`inline-flex h-10 shrink-0 items-center rounded-lg px-2.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${pathname === "/guide" ? "bg-subtle text-ink" : "text-muted hover:bg-subtle hover:text-ink"}`}>가이드</Link>
        </nav>
        <div className="flex min-w-0 items-center justify-end gap-2">
          {currentUser ? (
            <div ref={accountMenuRef} className="relative min-w-0">
              <button ref={accountButtonRef} type="button" aria-expanded={isAccountMenuOpen} aria-controls="account-navigation" aria-label={`${currentUser.name} 계정 메뉴`}
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 transition-colors hover:bg-subtle sm:px-2">
                <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">{currentUser.name.slice(0, 1)}</span>
                <span className="hidden max-w-24 truncate text-sm font-medium text-secondary sm:block">{currentUser.name}</span>
                <Icon name="chevron" className="hidden size-3.5 text-muted sm:block" />
              </button>
              {isAccountMenuOpen ? (
                <nav id="account-navigation" aria-label="계정 메뉴" className="absolute right-0 top-13 z-40 w-56 rounded-xl border border-line bg-white p-1.5 shadow-popover">
                  <div className="mb-1 border-b border-line px-3 py-3"><p className="truncate text-sm font-semibold">{currentUser.name}</p><p className="mt-0.5 truncate text-xs text-muted">{currentUser.username}</p></div>
                  {[{ href: "/profile", label: "내 프로필" }, { href: "/inquiries", label: "내 문의" }, { href: "/inquiries/new", label: "문의하기" }].map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsAccountMenuOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 text-sm text-secondary transition-colors hover:bg-subtle">{item.label}</Link>
                  ))}
                  <div className="mt-1 border-t border-line pt-1"><button type="button" onClick={() => void handleSignOut()} className="flex min-h-11 w-full items-center rounded-lg px-3 text-sm text-danger transition-colors hover:bg-danger-soft">로그아웃</button></div>
                </nav>
              ) : null}
            </div>
          ) : (
            <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-lg bg-ink px-3 text-xs font-medium text-white transition-colors hover:bg-secondary sm:px-4 sm:text-sm">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}
