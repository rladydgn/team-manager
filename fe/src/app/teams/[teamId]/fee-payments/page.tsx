"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import {
  FeePaymentStatus,
  getTeamFeePayments,
  TeamFeePaymentMember,
  TeamFeePaymentsYear,
  updateTeamFeePayment,
} from "@/features/team/api/fee-payment";
import { getTeam, TeamDetail } from "@/features/team/api/team";
import { TeamDetailTabs } from "@/features/team/ui/TeamDetailTabs";

const months = Array.from({ length: 12 }, (_, index) => index + 1);

const statusLabels: Record<FeePaymentStatus, string> = {
  PAID: "납부",
  UNPAID: "미납",
  INJURED: "부상",
};

const statusClassNames: Record<FeePaymentStatus, string> = {
  PAID: "border-[#b8d7c1] bg-[#f1f8f2] text-[#36734a]",
  UNPAID: "border-[#f1d3d1] bg-[#fff5f4] text-[#a85450]",
  INJURED: "border-[#d8d4e9] bg-[#f6f5fb] text-[#695c91]",
};

type MemoEditor = {
  member: TeamFeePaymentMember;
  month: number;
  status: FeePaymentStatus;
  memo: string;
};

function getCurrentYear() {
  return new Date().getFullYear();
}

function isFeeManager(role: TeamDetail["members"][number]["role"] | undefined) {
  return role === "OWNER" || role === "SUB_MANAGER";
}

export default function TeamFeePaymentsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const currentYear = getCurrentYear();
  const [paymentYear, setPaymentYear] = useState(currentYear);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [feePayments, setFeePayments] = useState<TeamFeePaymentsYear | null>(null);
  const [memoEditor, setMemoEditor] = useState<MemoEditor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingPaymentKey, setUpdatingPaymentKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const availableYears = useMemo(
    () => Array.from({ length: 7 }, (_, index) => currentYear - 5 + index),
    [currentYear]
  );

  const canManageFees = isFeeManager(
    teamDetail?.members.find((member) => member.userId === currentUser?.id)?.role
  );

  const loadFeePayments = useCallback(async () => {
    if (!isSessionReady) {
      return;
    }

    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      setErrorMessage("로그인 후 회비 납부 현황을 확인할 수 있습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const teamResponse = await getTeam(teamId);
      const detail = teamResponse.data;
      const role = detail?.members.find(
        (member) => member.userId === currentUser.id
      )?.role;

      if (!detail || !isFeeManager(role)) {
        setTeamDetail(detail ?? null);
        setFeePayments(null);
        setErrorMessage("회비 납부 현황은 팀장 또는 부관리자만 볼 수 있습니다.");
        return;
      }

      const feePaymentsResponse = await getTeamFeePayments(teamId, paymentYear);
      setTeamDetail(detail);
      setFeePayments(feePaymentsResponse.data ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "회비 납부 현황을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isSessionReady, paymentYear, teamId]);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadFeePayments();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isSessionReady, loadFeePayments]);

  function replacePayment(
    teamMemberId: number,
    paymentMonth: number,
    status: FeePaymentStatus,
    memo: string | null
  ) {
    setFeePayments((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        members: current.members.map((member) =>
          member.teamMemberId === teamMemberId
            ? {
                ...member,
                payments: member.payments.map((payment) =>
                  payment.paymentMonth === paymentMonth
                    ? { ...payment, status, memo }
                    : payment
                ),
              }
            : member
        ),
      };
    });
  }

  async function savePayment(
    member: TeamFeePaymentMember,
    paymentMonth: number,
    status: FeePaymentStatus,
    memo: string
  ): Promise<boolean> {
    const paymentKey = `${member.teamMemberId}-${paymentMonth}`;
    setUpdatingPaymentKey(paymentKey);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const response = await updateTeamFeePayment(teamId, {
        teamMemberId: member.teamMemberId,
        paymentYear,
        paymentMonth,
        status,
        memo,
      });

      if (!response.data) {
        throw new Error("저장된 회비 납부 정보를 받지 못했습니다.");
      }

      replacePayment(
        response.data.teamMemberId,
        response.data.paymentMonth,
        response.data.status,
        response.data.memo
      );
      setNoticeMessage("회비 납부 정보를 저장했습니다.");
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "회비 납부 정보를 저장하지 못했습니다."
      );
      return false;
    } finally {
      setUpdatingPaymentKey(null);
    }
  }

  async function saveMemo() {
    if (!memoEditor) {
      return;
    }

    setIsSaving(true);
    const isSaved = await savePayment(
      memoEditor.member,
      memoEditor.month,
      memoEditor.status,
      memoEditor.memo
    );
    setIsSaving(false);
    if (isSaved) {
      setMemoEditor(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header data-legacy-page-header className="border-b border-[#dbe4f0] bg-white/90">
        <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">TM</span>
            <span className="truncate text-base font-semibold">Team Manager</span>
          </Link>
          {currentUser ? (
            <span className="truncate rounded-md border border-[#c8d4e6] bg-white px-3 py-2 text-sm font-semibold text-[#3d5b86]">{currentUser.name}</span>
          ) : (
            <Link href="/login" className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa]">로그인</Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        {Number.isInteger(teamId) && teamId > 0 ? (
          <TeamDetailTabs teamId={teamId} activeTab="feePayments" canManageFees={canManageFees} />
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">회비 납부 현황을 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">회비 납부 현황을 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            {canManageFees ? <button type="button" onClick={() => void loadFeePayments()} className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]">다시 시도</button> : null}
          </section>
        ) : teamDetail && feePayments ? (
          <>
            <section className="flex flex-col gap-4 border-b border-[#dbe4f0] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#4f6f9f]">FEE PAYMENT</p>
                <h1 className="mt-2 text-3xl font-bold text-[#0f172a] sm:text-4xl">{teamDetail.team.name} 회비 납부</h1>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">팀장과 부관리자가 월별 납부 상태와 메모를 관리합니다.</p>
              </div>
              <label className="grid w-fit gap-1.5 text-sm font-semibold text-[#475569]">
                조회 연도
                <select value={paymentYear} onChange={(event) => setPaymentYear(Number(event.target.value))} className="h-10 rounded-md border border-[#c8d4e6] bg-white px-3 text-sm font-semibold text-[#1f2937] outline-none focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]">
                  {availableYears.map((year) => <option key={year} value={year}>{year}년</option>)}
                </select>
              </label>
            </section>

            {noticeMessage ? <p className="rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-4 py-3 text-sm font-medium text-[#3d5b86]">{noticeMessage}</p> : null}

            <section className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-[#0f172a]">{feePayments.paymentYear}년 월별 납부 현황</h2>
                  <p className="mt-1 text-sm text-[#64748b]">각 월의 상태를 변경하고 메모를 남길 수 있습니다.</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-[#3d5b86]">총 {feePayments.members.length}명</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[74rem] border-collapse text-left text-sm">
                  <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                    <tr>
                      <th scope="col" className="sticky left-0 z-10 min-w-36 bg-[#f8fafc] px-5 py-3 sm:px-6">팀원</th>
                      {months.map((month) => <th key={month} scope="col" className="min-w-28 px-2 py-3 text-center">{month}월</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {feePayments.members.map((member) => (
                      <tr key={member.teamMemberId}>
                        <td className="sticky left-0 z-10 bg-white px-5 py-4 sm:px-6">
                          <p className="font-semibold text-[#1f2937]">{member.name}</p>
                          <p className="mt-1 text-xs text-[#64748b]">{member.role === "OWNER" ? "팀장" : member.role === "SUB_MANAGER" ? "부관리자" : member.role === "GUEST" ? "용병" : "팀원"}</p>
                        </td>
                        {member.payments.map((payment) => {
                          const paymentKey = `${member.teamMemberId}-${payment.paymentMonth}`;
                          const isUpdating = updatingPaymentKey === paymentKey;

                          return (
                            <td key={payment.paymentMonth} className="px-2 py-3 align-top">
                              <div className="grid gap-1.5">
                                <select
                                  value={payment.status}
                                  disabled={isUpdating}
                                  onChange={(event) => void savePayment(member, payment.paymentMonth, event.target.value as FeePaymentStatus, payment.memo ?? "")}
                                  className={`h-8 rounded-md border px-2 text-xs font-semibold outline-none disabled:cursor-not-allowed ${statusClassNames[payment.status]}`}
                                  aria-label={`${member.name} ${payment.paymentMonth}월 회비 상태`}
                                >
                                  {(Object.keys(statusLabels) as FeePaymentStatus[]).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setMemoEditor({ member, month: payment.paymentMonth, status: payment.status, memo: payment.memo ?? "" })}
                                  className={`h-7 text-left text-xs font-semibold transition-colors ${payment.memo ? "text-[#3d5b86] hover:text-[#283f62]" : "text-[#94a3b8] hover:text-[#64748b]"}`}
                                >
                                  {payment.memo ? "메모 있음" : "메모"}
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>

      {memoEditor ? (
        <div className="fixed inset-0 z-50 flex items-end bg-[#0f172a]/30 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="fee-memo-title">
          <section className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="fee-memo-title" className="text-lg font-bold text-[#0f172a]">{memoEditor.member.name} · {memoEditor.month}월 메모</h2>
                <p className="mt-1 text-sm text-[#64748b]">납부 사유나 확인 내용을 남겨주세요.</p>
              </div>
              <button type="button" onClick={() => setMemoEditor(null)} disabled={isSaving} className="inline-flex size-9 items-center justify-center rounded-md border border-[#dbe4f0] text-lg text-[#64748b] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed" aria-label="메모 창 닫기">x</button>
            </div>
            <textarea value={memoEditor.memo} onChange={(event) => setMemoEditor((current) => current ? { ...current, memo: event.target.value } : null)} maxLength={500} rows={5} className="mt-5 w-full resize-y rounded-md border border-[#c8d4e6] bg-white px-3 py-2.5 text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8] focus:border-[#4f6f9f] focus:ring-4 focus:ring-[#e3eaf5]" placeholder="예: 부상 회복 중, 다음 달 납부 예정" />
            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-xs text-[#94a3b8]">{memoEditor.memo.length}/500</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setMemoEditor(null)} disabled={isSaving} className="inline-flex h-10 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 text-sm font-semibold text-[#52627b] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed">취소</button>
                <button type="button" onClick={() => void saveMemo()} disabled={isSaving} className="inline-flex h-10 items-center justify-center rounded-md bg-[#4f6f9f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#a9b9d3]">{isSaving ? "저장 중" : "저장"}</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
