"use client";

import Link from "next/link";
import { useCurrentUser } from "@/features/auth/model/auth-session";

const activityItems = [
  { label: "다가오는 경기", value: "일정 관리", detail: "경기 일정과 장소를 한눈에" },
  { label: "팀원 현황", value: "구성원 관리", detail: "역할과 참여 상태를 정리" },
  { label: "경기 기록", value: "결과 축적", detail: "스코어와 메모를 팀의 자산으로" },
];

const anonymousActions = [
  {
    title: "팀 둘러보기",
    description: "등록된 팀의 정보와 멤버 구성을 확인합니다.",
    href: "/teams",
    action: "팀 목록 보기",
  },
  {
    title: "운영 시작",
    description: "계정을 만들고 첫 팀을 등록해 운영을 시작합니다.",
    href: "/sign-up",
    action: "회원가입",
  },
];

const memberActions = [
  {
    title: "내 팀 관리",
    description: "팀 정보, 멤버, 경기 일정을 한곳에서 관리합니다.",
    href: "/teams",
    action: "팀 관리로 이동",
  },
  {
    title: "새 팀 만들기",
    description: "새로운 팀을 등록하고 운영진으로 바로 시작합니다.",
    href: "/teams",
    action: "팀 목록 열기",
  },
];

export default function HomePage() {
  const currentUser = useCurrentUser();
  const isSignedIn = Boolean(currentUser);
  const primaryAction = isSignedIn
    ? { href: "/teams", label: "내 팀 관리" }
    : { href: "/login", label: "로그인" };
  const secondaryAction = isSignedIn
    ? { href: "/teams", label: "팀 둘러보기" }
    : { href: "/sign-up", label: "회원가입" };
  const actionItems = isSignedIn ? memberActions : anonymousActions;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header data-legacy-page-header className="border-b border-[#dbe4f0] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">
              TM
            </span>
            <span className="truncate text-base font-semibold">Team Manager</span>
          </Link>

          {isSignedIn ? (
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="hidden truncate text-sm font-semibold text-[#52627b] sm:block">
                {currentUser?.name}
              </span>
              <Link
                href="/teams"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-[#4f6f9f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
              >
                팀 관리
              </Link>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] sm:px-4"
              >
                로그인
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-3 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] sm:px-4"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="border-b border-[#dbe4f0] bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.86fr)] lg:items-center lg:px-8 lg:py-16">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#4f6f9f]">
              {isSignedIn ? "TEAM OPERATIONS" : "FOOTBALL TEAM MANAGEMENT"}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-[#0f172a] sm:text-5xl">
              {isSignedIn
                ? `${currentUser?.name}님, 팀 운영을 이어가세요.`
                : "팀 운영에 필요한 일을 한곳에 모으세요."}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#64748b] sm:text-lg">
              {isSignedIn
                ? "팀 정보와 멤버 현황, 경기 일정을 빠르게 확인하고 다음 작업으로 이어갈 수 있습니다."
                : "팀 정보, 멤버, 경기 일정과 결과를 차분하고 명확하게 관리할 수 있습니다."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryAction.href}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#4f6f9f] px-6 text-base font-semibold text-white transition-colors hover:bg-[#435f88]"
              >
                {primaryAction.label}
              </Link>
              <Link
                href={secondaryAction.href}
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-6 text-base font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
              >
                {secondaryAction.label}
              </Link>
            </div>
          </div>

          <section className="border border-[#d3deec] bg-[#edf3fa] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-5">
            <div className="border border-[#cbd9ea] bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-[#e5eaf3] px-4 py-4 sm:px-5">
                <div>
                  <p className="text-xs font-semibold text-[#4f6f9f]">이번 주 운영 보드</p>
                  <h2 className="mt-1 text-xl font-bold text-[#0f172a]">
                    {isSignedIn ? "팀 운영 현황" : "팀 활동 한눈에 보기"}
                  </h2>
                </div>
                <span className="rounded-md border border-[#c8d4e6] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                  ACTIVE
                </span>
              </div>

              <div className="grid gap-px bg-[#e5eaf3] sm:grid-cols-3">
                {activityItems.map((item) => (
                  <div key={item.label} className="bg-white px-4 py-4">
                    <p className="text-xs font-semibold text-[#64748b]">{item.label}</p>
                    <p className="mt-2 text-base font-bold text-[#1f2937]">{item.value}</p>
                    <p className="mt-1 text-xs leading-5 text-[#64748b]">{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#1f2937]">다음 운영 작업</p>
                    <p className="mt-1 text-sm text-[#64748b]">
                      {isSignedIn ? "팀을 선택해 멤버와 경기 일정을 관리하세요." : "로그인 후 팀 운영을 시작할 수 있습니다."}
                    </p>
                  </div>
                  <Link
                    href={primaryAction.href}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-3 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]"
                  >
                    이동
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#4f6f9f]">QUICK ACTIONS</p>
            <h2 className="mt-2 text-2xl font-bold text-[#0f172a]">
              {isSignedIn ? "바로 이어서 관리하기" : "팀 운영을 시작하는 방법"}
            </h2>
          </div>
          <Link
            href="/teams"
            className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]"
          >
            팀 목록 보기
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {actionItems.map((item) => (
            <article
              key={item.title}
              className="flex min-h-44 flex-col justify-between border border-[#dbe4f0] bg-white p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]"
            >
              <div>
                <h3 className="text-lg font-bold text-[#0f172a]">{item.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-[#64748b]">{item.description}</p>
              </div>
              <Link
                href={item.href}
                className="mt-5 inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]"
              >
                {item.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
