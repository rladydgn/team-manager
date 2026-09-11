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
          if (!allowed) setErrorMessage("팀장과 부관리자만 시즌을 생성할 수 있습니다.");
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
    <main className="min-h-screen bg-[#f5f7fb] px-5 py-8 text-[#111827] sm:px-6">
      <section className="mx-auto max-w-xl rounded-xl border border-[#dbe4f0] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-[#4f6f9f]">NEW SEASON</p>
        <h1 className="mt-2 text-3xl font-bold text-[#0f172a]">시즌 생성</h1>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">통계와 순위에서 빠르게 선택할 시즌 이름과 기간을 입력하세요.</p>

        {errorMessage ? <p className="mt-5 rounded-md border border-[#fecaca] bg-[#fff7f7] px-4 py-3 text-sm text-[#b91c1c]">{errorMessage}</p> : null}

        {isAllowed ? (
          <form onSubmit={submit} className="mt-7 grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-[#334155]">
              시즌 이름
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} placeholder="예: 25/26 시즌" required className="h-11 rounded-md border border-[#c8d4e6] px-3 font-normal outline-none focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[#334155]">시작일<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required className="h-11 rounded-md border border-[#c8d4e6] px-3 font-normal outline-none focus:border-[#4f6f9f]" /></label>
              <label className="grid gap-2 text-sm font-semibold text-[#334155]">종료일<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required className="h-11 rounded-md border border-[#c8d4e6] px-3 font-normal outline-none focus:border-[#4f6f9f]" /></label>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href={`/team/${teamId}/season`} className="inline-flex h-11 items-center justify-center rounded-md border border-[#c8d4e6] px-5 text-sm font-semibold text-[#475569]">취소</Link>
              <button disabled={isSaving} className="inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "저장 중..." : "시즌 저장"}</button>
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
}
