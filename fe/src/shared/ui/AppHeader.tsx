"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, endSession } = useAuthSession();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const isTeamsPage = pathname === "/teams" || pathname.startsWith("/teams/");

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
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">
            TM
          </span>
          <span className="hidden truncate text-base font-semibold sm:block">Team Manager</span>
        </Link>

        <nav aria-label="주요 메뉴" className="flex items-center justify-center">
          <Link
            href="/teams"
            className={`inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors sm:px-4 ${
              isTeamsPage
                ? "bg-[#edf3fa] text-[#2f4d76]"
                : "text-[#52627b] hover:bg-[#f0f4fa] hover:text-[#2f4d76]"
            }`}
          >
            팀
          </Link>
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2">
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                className="inline-flex h-10 max-w-36 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-3 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
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
