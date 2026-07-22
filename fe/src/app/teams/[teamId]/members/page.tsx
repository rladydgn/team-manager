"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import { getTeam, TeamDetail, TeamMember } from "@/features/team/api/team";
import { TeamDetailTabs } from "@/features/team/ui/TeamDetailTabs";

const roleLabels: Record<TeamMember["role"], string> = {
  OWNER: "팀장",
  SUB_MANAGER: "부관리자",
  MEMBER: "팀원",
  GUEST: "용병",
};

const roleOrder: Record<TeamMember["role"], number> = {
  OWNER: 0,
  SUB_MANAGER: 1,
  MEMBER: 2,
  GUEST: 3,
};

function formatJoinedAt(value: string | null) {
  if (!value) {
    return "미등록";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function TeamMembersPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const currentUser = useCurrentUser();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTeam = useCallback(async () => {
    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getTeam(teamId);
      setTeamDetail(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀원 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadTeam();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadTeam]);

  const members = useMemo(
    () =>
      [...(teamDetail?.members ?? [])].sort(
        (left, right) => roleOrder[left.role] - roleOrder[right.role]
      ),
    [teamDetail?.members]
  );
  const canManageFees = teamDetail?.members.some(
    (member) =>
      member.userId === currentUser?.id &&
      (member.role === "OWNER" || member.role === "SUB_MANAGER")
  ) ?? false;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header data-legacy-page-header className="border-b border-[#dbe4f0] bg-white/90">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">TM</span>
            <span className="truncate text-base font-semibold">Team Manager</span>
          </Link>
          {currentUser ? (
            <span className="truncate rounded-md border border-[#c8d4e6] bg-white px-3 py-2 text-sm font-semibold text-[#3d5b86]">
              {currentUser.name}
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

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        {Number.isInteger(teamId) && teamId > 0 ? (
          <TeamDetailTabs teamId={teamId} activeTab="members" canManageFees={canManageFees} />
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">팀원 목록을 불러오는 중입니다.</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">팀원 목록을 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadTeam()}
              className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              다시 시도
            </button>
          </section>
        ) : teamDetail ? (
          <>
            <section className="flex flex-col gap-3 border-b border-[#dbe4f0] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#4f6f9f]">TEAM MEMBERS</p>
                <h1 className="mt-2 text-3xl font-bold text-[#0f172a] sm:text-4xl">
                  {teamDetail.team.name} 팀원
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">
                  현재 활동 중인 팀원의 역할과 가입일을 확인할 수 있습니다.
                </p>
              </div>
              <span className="w-fit rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-3 py-1.5 text-sm font-semibold text-[#3d5b86]">
                총 {members.length}명
              </span>
            </section>

            <section className="overflow-hidden rounded-lg border border-[#dbe4f0] bg-white">
              {members.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-[#64748b]">
                  아직 등록된 팀원이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left text-sm">
                    <thead className="bg-[#f8fafc] text-xs font-semibold text-[#64748b]">
                      <tr>
                        <th scope="col" className="px-5 py-3 sm:px-6">이름</th>
                        <th scope="col" className="px-5 py-3">가입일</th>
                        <th scope="col" className="px-5 py-3 text-right sm:px-6">역할</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-5 py-4 font-semibold text-[#1f2937] sm:px-6">
                            {member.name ?? (member.userId ? "가입 팀원" : "미가입 팀원")}
                          </td>
                          <td className="px-5 py-4 text-[#64748b]">
                            {formatJoinedAt(member.joinedAt)}
                          </td>
                          <td className="px-5 py-4 text-right sm:px-6">
                            <span className="inline-flex rounded-md border border-[#dbe4f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                              {roleLabels[member.role]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
