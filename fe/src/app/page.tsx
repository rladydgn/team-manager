"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { getTeams, type Team } from "@/features/team/api/team";
import { Icon } from "@/shared/ui/Icon";
import { PageHeading } from "@/shared/ui/PageHeading";

function MyTeams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getTeams().then(({ data }) => {
      if (active) setTeams((data ?? []).filter((team) => team.membershipStatus === "ACTIVE"));
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);

  return (
    <section aria-labelledby="my-teams-heading">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 id="my-teams-heading" className="text-base font-semibold">내 팀 {teams ? <span className="ml-1 text-muted">{teams.length}</span> : null}</h2><Link href="/team" className="btn-quiet">전체 팀 <Icon name="arrow" /></Link></div>
      {error ? <div className="surface-card px-6 py-8 text-center"><p className="text-sm text-muted">팀을 불러오지 못했습니다.</p><button className="btn-secondary mt-4" onClick={() => { setError(false); setAttempt((value) => value + 1); }}>다시 시도</button></div>
        : !teams ? <div role="status" className="surface-card px-6 py-12 text-sm text-muted">내 팀을 불러오고 있습니다.</div>
        : teams.length === 0 ? <div className="surface-card flex flex-col items-center px-6 py-10 text-center"><span className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon name="users" className="size-5" /></span><h3 className="font-semibold">함께할 팀을 찾아보세요</h3><p className="mt-2 text-sm leading-6 text-muted">팀에 가입하거나 새 팀을 만들어 시작할 수 있습니다.</p><Link href="/team" className="btn-secondary mt-5">팀 찾아보기 <Icon name="arrow" /></Link></div>
        : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{teams.map((team) => <Link key={team.id} href={`/team/${team.id}`} className="surface-card group flex items-center gap-4 p-5 transition-colors hover:border-brand"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-sm font-semibold text-brand-ink">{(team.shortName || team.name).slice(0, 2)}</span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{team.name}</h3><p className="mt-1 truncate text-xs text-muted">{team.region || "활동 지역 미등록"}</p></div><Icon name="arrow" className="size-4 text-placeholder transition-colors group-hover:text-brand" /></Link>)}</div>}
    </section>
  );
}

export default function HomePage() {
  const { currentUser, isSessionReady } = useAuthSession();
  return (
    <main className="flex-1 bg-canvas">
      <div className="page-shell gap-10 sm:gap-12">
        {currentUser ? <>
          <PageHeading label="나의 팀 공간" title={`${currentUser.name}님, 반가워요`} description="팀을 선택해 경기 일정과 팀 소식을 확인하세요." action={<Link href="/team" className="btn-primary"><Icon name="users" />팀 찾기</Link>} />
          <MyTeams key={currentUser.id} />
        </> : !isSessionReady ? <p role="status" className="py-12 text-sm text-muted">내 정보를 확인하고 있습니다.</p> : (
          <section className="grid gap-8 py-6 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
            <div><p className="eyebrow mb-4">우리 팀의 모든 순간, 한곳에</p><h1 className="text-4xl font-semibold leading-[1.2] tracking-tight text-ink sm:text-5xl">운영은 가볍게.<br /><span className="text-brand">경기에 더 집중하세요.</span></h1><p className="mt-5 max-w-md text-base leading-7 text-muted">팀원부터 경기 일정, 기록과 회비까지.<br />팀 운영에 필요한 일을 함께 정리하세요.</p><div className="mt-7 flex flex-wrap gap-2"><Link href="/sign-up" className="btn-primary">시작하기 <Icon name="arrow" /></Link><Link href="/team" className="btn-secondary">팀 둘러보기</Link></div></div>
            <div className="surface-card divide-y divide-line p-2 sm:p-3">
              {([{ icon: "users", title: "함께하는 팀원", text: "가입 승인과 팀원 정보를 한곳에서" }, { icon: "calendar", title: "다가오는 경기", text: "경기 일정과 참석 여부를 간편하게" }, { icon: "chart", title: "쌓여가는 기록", text: "경기 결과와 팀원별 통계를 한눈에" }] as const).map((item) => <div key={item.title} className="flex items-center gap-4 p-4 sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon name={item.icon} className="size-5" /></span><div><h2 className="text-sm font-semibold">{item.title}</h2><p className="mt-1 text-sm leading-6 text-muted">{item.text}</p></div></div>)}
            </div>
          </section>
        )}
        <section className="grid gap-4 sm:grid-cols-2" aria-label="도움말과 문의">
          <Link href="/guide" className="group flex items-start gap-4 rounded-xl border border-line p-5 transition-colors hover:bg-white sm:p-6"><Icon name="book" className="mt-0.5 size-5 text-brand" /><div className="flex-1"><h2 className="text-sm font-semibold">처음이라면, 이용 가이드</h2><p className="mt-2 text-sm leading-6 text-muted">가입 승인과 기존 팀원 기록 연결 방법을 확인하세요.</p></div><Icon name="arrow" className="mt-0.5 size-4 text-placeholder" /></Link>
          <Link href={currentUser ? "/inquiries/new" : "/login"} className="group flex items-start gap-4 rounded-xl border border-line p-5 transition-colors hover:bg-white sm:p-6"><Icon name="message" className="mt-0.5 size-5 text-brand" /><div className="flex-1"><h2 className="text-sm font-semibold">도움이 필요하신가요?</h2><p className="mt-2 text-sm leading-6 text-muted">{currentUser ? "궁금한 점이나 개선할 점을 서비스 운영자에게 알려주세요." : "로그인 후 서비스 운영자에게 문의를 남길 수 있습니다."}</p></div><Icon name="arrow" className="mt-0.5 size-4 text-placeholder" /></Link>
        </section>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-muted"><span>Team Manager</span><span>함께 뛰는 팀을 위한 공간</span></footer>
      </div>
    </main>
  );
}
