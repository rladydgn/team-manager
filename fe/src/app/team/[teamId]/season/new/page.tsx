"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { createTeamSeason } from "@/features/team/api/season";
import { getTeam } from "@/features/team/api/team";

export default function NewTeamSeasonPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const router = useRouter();
  const { currentUser, isSessionReady } = useAuthSession();
  const [isAllowed, setIsAllowed] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isSessionReady) return;
    const timerId = window.setTimeout(() => {
      if (!currentUser || !Number.isInteger(teamId) || teamId <= 0) {
        setErrorMessage("시즌을 생성할 수 없습니다.");
        return;
      }
      void getTeam(teamId)
        .then((response) => {
          const member = response.data?.members.find((item) => item.userId === currentUser.id);
          const allowed = member?.role === "OWNER" || member?.role === "SUB_MANAGER";
          setIsAllowed(allowed);
          if (!allowed) setErrorMessage("운영진만 시즌을 생성할 수 있습니다.");
        })
        .catch((error) => setErrorMessage(error instanceof Error ? error.message : "팀 정보를 불러오지 못했습니다."));
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [currentUser, isSessionReady, teamId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startDate > endDate) {
      setErrorMessage("시작일은 종료일보다 앞서야 합니다.");
      return;
    }
    setIsSaving(true);
    setErrorMessage("");
    try {
      await createTeamSeason(teamId, { name: name.trim(), startDate, endDate });
      router.push(`/team/${teamId}/season`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "시즌을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas px-5 py-8 text-ink sm:px-6">
      <section className="mx-auto max-w-xl rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-brand">새 시즌</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">시즌 생성</h1>
        <p className="mt-3 text-sm leading-6 text-muted">통계와 순위에서 빠르게 선택할 시즌 이름과 기간을 입력하세요.</p>

        {errorMessage ? <p className="mt-5 rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{errorMessage}</p> : null}

        {isAllowed ? (
          <form onSubmit={submit} className="mt-7 grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-secondary">
              시즌 이름
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} placeholder="예: 25/26 시즌" required className="h-11 rounded-lg border border-line-strong px-3 font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-secondary">시작일<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required className="h-11 rounded-lg border border-line-strong px-3 font-normal outline-none focus:border-brand" /></label>
              <label className="grid gap-2 text-sm font-semibold text-secondary">종료일<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required className="h-11 rounded-lg border border-line-strong px-3 font-normal outline-none focus:border-brand" /></label>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href={`/team/${teamId}/season`} className="inline-flex h-11 items-center justify-center rounded-lg border border-line-strong px-5 text-sm font-semibold text-secondary">취소</Link>
              <button disabled={isSaving} className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "저장 중..." : "시즌 저장"}</button>
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
}
