"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import { TeamDetailTabs } from "@/features/team/ui/TeamDetailTabs";
import {
  deleteTeam,
  getTeam,
  joinTeam,
  TeamDetail,
} from "@/features/team/api/team";

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
      setErrorMessage("팀 삭제는 팀장이 팀에 혼자 남아 있을 때만 할 수 있습니다.");
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
      router.replace("/team");
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
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        {Number.isInteger(teamId) && teamId > 0 ? (
          <TeamDetailTabs
            teamId={teamId}
            activeTab="overview"
            canAccessTeamFeatures={isMember}
            canManageFees={canEditTeam}
          />
        ) : null}

        {errorMessage && !teamDetail ? (
          <section className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">팀 정보를 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-danger">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadTeam()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              다시 시도
            </button>
          </section>
        ) : isLoading ? (
          <section className="flex min-h-80 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">팀 정보를 불러오는 중입니다.</p>
          </section>
        ) : teamDetail ? (
          <>
            <section className="surface-card p-5 sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-base font-semibold text-brand-ink">
                    {getInitials(teamDetail.team.shortName || teamDetail.team.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-ink">
                      {teamDetail.team.shortName || "우리 팀"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h1 className="break-words page-title">
                        {teamDetail.team.name}
                      </h1>
                      <span className="rounded-lg border border-line-strong bg-white/80 px-2.5 py-1 text-xs font-semibold text-brand-ink">
                        {teamDetail.team.status === "ACTIVE" ? "운영 중" : "비활성"}
                      </span>
                    </div>
                    <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-secondary sm:text-base">
                      {teamDetail.team.region || "활동 지역 미등록"} · 팀원 {teamDetail.memberCount}명
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap gap-2 lg:max-w-md lg:justify-end">
                  {canEditTeam ? (
                    <Link
                      href={`/team/${teamDetail.team.id}/edit`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-line-strong bg-white px-5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft sm:w-auto"
                    >
                      팀 수정
                    </Link>
                  ) : null}

                  {canEditTeam ? (
                    <Link
                      href={`/team/${teamDetail.team.id}/join-request`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-line-strong bg-white px-5 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft sm:w-auto"
                    >
                      가입 신청 관리
                    </Link>
                  ) : null}
                  {canCreateMatch ? (
                    <Link
                      href={`/team/${teamDetail.team.id}/match/new`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover sm:w-auto"
                    >
                      경기 등록
                    </Link>
                  ) : isOwner ? (
                    <span className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-brand-ink sm:w-auto">
                      가입 완료
                    </span>
                  ) : isMember ? (
                    <span className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-brand-ink sm:w-auto">
                      가입 완료
                    </span>
                  ) : isJoinRequestPending ? (
                    <span className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-brand-ink sm:w-auto">
                      가입 신청 대기 중
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleJoin()}
                      disabled={isJoining || !currentUser}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-subtle disabled:text-secondary sm:w-auto"
                    >
                      {isJoining ? "신청 중..." : "가입 신청"}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {!currentUser ? (
              <section className="rounded-xl border border-line bg-white px-5 py-4 text-sm leading-6 text-muted">
                이 팀에 가입하려면{" "}
                <Link href="/login" className="font-semibold text-brand-ink">
                  로그인
                </Link>
                해 주세요.
              </section>
            ) : null}

            {errorMessage ? (
              <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                {errorMessage}
              </p>
            ) : null}

            {noticeMessage ? (
              <p className="rounded-lg border border-line-strong bg-brand-soft px-4 py-3 text-sm font-medium text-brand-ink">
                {noticeMessage}
              </p>
            ) : null}





            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <section className="rounded-xl border border-line bg-white">
                <div className="border-b border-line px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">팀 소개</h2>
                  </div>
                </div>
                <p className="whitespace-pre-wrap break-words px-5 py-6 text-sm leading-7 text-secondary sm:px-6 sm:py-7 sm:text-base">
                  {teamDetail.team.description || "아직 등록된 팀 소개가 없습니다."}
                </p>
              </section>

              <aside className="rounded-xl border border-line bg-white p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-ink">팀 정보</h2>
                <dl className="mt-5 grid gap-5 text-sm">
                  <div>
                    <dt className="font-semibold text-muted">활동 지역</dt>
                    <dd className="mt-1 break-words font-semibold text-ink">
                      {teamDetail.team.region || "미등록"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">홈 구장</dt>
                    <dd className="mt-1 break-words font-semibold text-ink">
                      {teamDetail.team.homeStadium || "미등록"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">창단일</dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {formatDate(teamDetail.team.foundedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-muted">팀 등록일</dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {formatDate(teamDetail.team.createdAt)}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>
            <div className="flex justify-end">
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={openDeleteConfirmation}
                      className="btn-quiet text-muted hover:text-danger"
                    >
                      팀 삭제
                    </button>
                  ) : null}
            </div>
            {isDeleteConfirmOpen ? (
              <section className="border border-danger-line bg-danger-soft px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-danger">팀을 삭제할까요?</h2>
                    <p className="mt-2 text-sm leading-6 text-[#7f1d1d]">
                      팀은 삭제되며 복구할 수 없습니다. 이 작업은 팀에 본인만 남아 있을 때만 가능합니다.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      disabled={isDeleting}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-danger-line bg-white px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isDeleting}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-danger px-4 text-sm font-semibold text-white transition-colors hover:bg-danger disabled:cursor-not-allowed disabled:bg-danger-line"
                    >
                      {isDeleting ? "삭제 중..." : "팀 삭제"}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
