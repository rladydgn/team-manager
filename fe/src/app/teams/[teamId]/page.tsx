"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import {
  deleteTeam,
  getTeam,
  joinTeam,
  TeamDetail,
  TeamMember,
} from "@/features/team/api/team";

const roleLabels: Record<TeamMember["role"], string> = {
  OWNER: "팀장",
  SUB_MANAGER: "부관리자",
  MEMBER: "팀원",
  GUEST: "용병",
};

function formatDate(value: string | null) {
  if (!value) {
    return "미등록";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "TM";
}

export default function TeamDetailPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = Number(params.teamId);
  const currentUser = useCurrentUser();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoinRequestPending, setIsJoinRequestPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

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
        error instanceof Error ? error.message : "팀 정보를 불러오지 못했습니다."
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

  const memberSummary = useMemo(() => {
    const members = teamDetail?.members ?? [];

    return {
      total: members.length,
      managers: members.filter(
        (member) => member.role === "OWNER" || member.role === "SUB_MANAGER"
      ).length,
      guests: members.filter((member) => member.role === "GUEST").length,
    };
  }, [teamDetail]);

  const currentMember = teamDetail?.members.find(
    (member) => member.userId === currentUser?.id
  );
  const isOwner = currentMember?.role === "OWNER";
  const isMember = Boolean(currentMember);
  const canCreateMatch =
    currentMember?.role === "OWNER" || currentMember?.role === "SUB_MANAGER";
  const canEditTeam =
    currentMember?.role === "OWNER" || currentMember?.role === "SUB_MANAGER";
  const isSoleActiveMember =
    isOwner &&
    teamDetail?.members.length === 1 &&
    teamDetail?.members[0]?.userId === currentUser?.id;

  async function handleJoin() {
    if (!teamDetail) {
      return;
    }

    if (!currentUser) {
      setErrorMessage("팀에 가입하려면 먼저 로그인해 주세요.");
      return;
    }

    setErrorMessage("");
    setNoticeMessage("");
    setIsJoining(true);

    try {
      const response = await joinTeam(teamDetail.team.id);
      setIsJoinRequestPending(response.data?.status === "PENDING");
      setNoticeMessage(`${teamDetail.team.name} 팀 가입 신청이 완료되었습니다.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀 가입에 실패했습니다."
      );
    } finally {
      setIsJoining(false);
    }
  }

  function openDeleteConfirmation() {
    setErrorMessage("");
    setNoticeMessage("");

    if (!isSoleActiveMember) {
      setErrorMessage("팀 삭제는 OWNER가 팀에 혼자 남아 있을 때만 할 수 있습니다.");
      return;
    }

    setIsDeleteConfirmOpen(true);
  }

  async function handleDelete() {
    if (!teamDetail || !isSoleActiveMember) {
      setErrorMessage("팀 삭제 조건을 다시 확인해 주세요.");
      setIsDeleteConfirmOpen(false);
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteTeam(teamDetail.team.id);
      router.replace("/teams");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "팀을 삭제하지 못했습니다."
      );
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <header data-legacy-page-header className="border-b border-[#dbe4f0] bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-sm font-bold text-white">
              TM
            </span>
            <span className="truncate text-base font-semibold">Team Manager</span>
          </Link>

          {currentUser ? (
            <span className="truncate rounded-md border border-[#c8d4e6] bg-white px-3 py-2 text-sm font-semibold text-[#3d5b86]">
              {currentUser.username}
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

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/teams"
          className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]"
        >
          팀 목록으로
        </Link>

        {errorMessage && !teamDetail ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">팀 정보를 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadTeam()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              다시 시도
            </button>
          </section>
        ) : isLoading ? (
          <section className="flex min-h-80 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">팀 정보를 불러오는 중입니다.</p>
          </section>
        ) : teamDetail ? (
          <>
            <section className="rounded-lg border border-[#cdd9ea] bg-[#eaf0f8] p-5 sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                  <span className="grid size-14 shrink-0 place-items-center rounded-md bg-[#4f6f9f] text-lg font-bold text-white sm:size-16">
                    {getInitials(teamDetail.team.shortName || teamDetail.team.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#3d5b86]">
                      {teamDetail.team.shortName || "FOOTBALL TEAM"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h1 className="break-words text-3xl font-bold tracking-normal text-[#0f172a] sm:text-4xl">
                        {teamDetail.team.name}
                      </h1>
                      <span className="rounded-md border border-[#b9c9df] bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                        {teamDetail.team.status === "ACTIVE" ? "운영 중" : "비활성"}
                      </span>
                    </div>
                    <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-[#52627b] sm:text-base">
                      {teamDetail.team.description || "아직 등록된 팀 소개가 없습니다."}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {canEditTeam ? (
                    <Link
                      href={`/teams/${teamDetail.team.id}/edit`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#b9c9df] bg-white px-5 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] sm:w-auto"
                    >
                      팀 수정
                    </Link>
                  ) : null}
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={openDeleteConfirmation}
                      className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#fca5a5] bg-white px-5 text-sm font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2] sm:w-auto"
                    >
                      팀 삭제
                    </button>
                  ) : null}
                  {isMember ? (
                    <Link
                      href={`/teams/${teamDetail.team.id}/matches`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#b9c9df] bg-white px-5 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] sm:w-auto"
                    >
                      경기 일정
                    </Link>
                  ) : null}
                  {canEditTeam ? (
                    <Link
                      href={`/teams/${teamDetail.team.id}/join-requests`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#b9c9df] bg-white px-5 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] sm:w-auto"
                    >
                      가입 신청 관리
                    </Link>
                  ) : null}
                  {canCreateMatch ? (
                    <Link
                      href={`/teams/${teamDetail.team.id}/matches/new`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#435f88] sm:w-auto"
                    >
                      경기 등록
                    </Link>
                  ) : isOwner ? (
                    <span className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#b9c9df] bg-white px-4 text-sm font-semibold text-[#3d5b86] sm:w-auto">
                      내가 만든 팀
                    </span>
                  ) : isMember ? (
                    <span className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#b9c9df] bg-white px-4 text-sm font-semibold text-[#3d5b86] sm:w-auto">
                      가입한 팀
                    </span>
                  ) : isJoinRequestPending ? (
                    <span className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[#b9c9df] bg-white px-4 text-sm font-semibold text-[#3d5b86] sm:w-auto">
                      가입 신청 대기 중
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleJoin()}
                      disabled={isJoining || !currentUser}
                      className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#e1e8f2] disabled:text-[#52627b] sm:w-auto"
                    >
                      {isJoining ? "신청 중..." : "가입 신청"}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {!currentUser ? (
              <section className="rounded-lg border border-[#dbe4f0] bg-white px-5 py-4 text-sm leading-6 text-[#64748b]">
                이 팀에 가입하려면{" "}
                <Link href="/login" className="font-semibold text-[#3d5b86]">
                  로그인
                </Link>
                해 주세요.
              </section>
            ) : null}

            {errorMessage ? (
              <p className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]">
                {errorMessage}
              </p>
            ) : null}

            {noticeMessage ? (
              <p className="rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-4 py-3 text-sm font-medium text-[#3d5b86]">
                {noticeMessage}
              </p>
            ) : null}

            {isDeleteConfirmOpen ? (
              <section className="border border-[#fecaca] bg-[#fff7f7] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#991b1b]">팀을 삭제할까요?</h2>
                    <p className="mt-2 text-sm leading-6 text-[#7f1d1d]">
                      팀은 삭제되며 복구할 수 없습니다. 이 작업은 팀에 본인만 남아 있을 때만 가능합니다.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      disabled={isDeleting}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-[#fecaca] bg-white px-4 text-sm font-semibold text-[#991b1b] transition-colors hover:bg-[#fef2f2] disabled:cursor-not-allowed"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isDeleting}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-[#b91c1c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:bg-[#fca5a5]"
                    >
                      {isDeleting ? "삭제 중..." : "팀 삭제"}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-[#dbe4f0] bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[#64748b]">활성 팀원</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{memberSummary.total}명</p>
              </div>
              <div className="rounded-md border border-[#dbe4f0] bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[#64748b]">운영진</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{memberSummary.managers}명</p>
              </div>
              <div className="rounded-md border border-[#dbe4f0] bg-white px-4 py-4">
                <p className="text-sm font-semibold text-[#64748b]">용병</p>
                <p className="mt-2 text-2xl font-bold text-[#0f172a]">{memberSummary.guests}명</p>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <section className="rounded-lg border border-[#dbe4f0] bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#0f172a]">팀원</h2>
                    <p className="mt-1 text-sm text-[#64748b]">현재 활동 중인 멤버입니다.</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-[#3d5b86]">{memberSummary.total}명</span>
                </div>

                {teamDetail.members.length === 0 ? (
                  <div className="px-5 py-12 text-center text-sm text-[#64748b]">
                    아직 등록된 팀원이 없습니다.
                  </div>
                ) : (
                  <ul className="divide-y divide-[#e2e8f0]">
                    {teamDetail.members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1f2937]">
                            {member.name ?? (member.userId ? "가입 팀원" : "미가입 팀원")}
                          </p>
                          <p className="mt-1 text-xs text-[#64748b]">
                            {member.joinedAt ? `${formatDate(member.joinedAt)} 가입` : "가입일 미등록"}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md border border-[#dbe4f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#3d5b86]">
                          {roleLabels[member.role]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <aside className="rounded-lg border border-[#dbe4f0] bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold text-[#0f172a]">팀 정보</h2>
                <dl className="mt-5 grid gap-5 text-sm">
                  <div>
                    <dt className="font-semibold text-[#64748b]">활동 지역</dt>
                    <dd className="mt-1 break-words font-semibold text-[#1f2937]">
                      {teamDetail.team.region || "미등록"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#64748b]">홈 구장</dt>
                    <dd className="mt-1 break-words font-semibold text-[#1f2937]">
                      {teamDetail.team.homeStadium || "미등록"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#64748b]">창단일</dt>
                    <dd className="mt-1 font-semibold text-[#1f2937]">
                      {formatDate(teamDetail.team.foundedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#64748b]">팀 등록일</dt>
                    <dd className="mt-1 font-semibold text-[#1f2937]">
                      {formatDate(teamDetail.team.createdAt)}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
