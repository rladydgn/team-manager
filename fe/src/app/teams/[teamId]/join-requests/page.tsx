"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/features/auth/model/auth-session";
import {
  approveTeamJoinRequest,
  getTeam,
  getTeamJoinRequests,
  rejectTeamJoinRequest,
  TeamDetail,
  TeamMember,
} from "@/features/team/api/team";

function formatRequestedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TeamJoinRequestsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [requests, setRequests] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingMemberId, setProcessingMemberId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const loadJoinRequests = useCallback(async () => {
    if (!isSessionReady) {
      return;
    }

    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      setErrorMessage("로그인 후 가입 신청을 관리할 수 있습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const teamResponse = await getTeam(teamId);
      setTeamDetail(teamResponse.data);

      const requestsResponse = await getTeamJoinRequests(teamId);
      setRequests(requestsResponse.data ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "가입 신청 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isSessionReady, teamId]);

  useEffect(() => {
    if (!isSessionReady) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadJoinRequests();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [isSessionReady, loadJoinRequests]);

  const canManageJoinRequests = useMemo(() => {
    const role = teamDetail?.members.find(
      (member) => member.userId === currentUser?.id
    )?.role;

    return role === "OWNER" || role === "SUB_MANAGER";
  }, [currentUser?.id, teamDetail?.members]);

  async function handleJoinRequest(
    teamMember: TeamMember,
    decision: "approve" | "reject"
  ) {
    if (!teamDetail || !canManageJoinRequests) {
      setErrorMessage("가입 신청을 관리할 권한이 없습니다.");
      return;
    }

    setProcessingMemberId(teamMember.id);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      if (decision === "approve") {
        await approveTeamJoinRequest(teamDetail.team.id, teamMember.id);
        setNoticeMessage(`${teamMember.name ?? "신청자"} 님을 팀원으로 승인했습니다.`);
      } else {
        await rejectTeamJoinRequest(teamDetail.team.id, teamMember.id);
        setNoticeMessage(`${teamMember.name ?? "신청자"} 님의 가입 신청을 거부했습니다.`);
      }

      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== teamMember.id)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "가입 신청을 처리하지 못했습니다."
      );
    } finally {
      setProcessingMemberId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-7 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href={Number.isInteger(teamId) && teamId > 0 ? `/teams/${teamId}` : "/teams"}
          className="inline-flex w-fit text-sm font-semibold text-[#3d5b86] transition-colors hover:text-[#283f62]"
        >
          팀 상세로 돌아가기
        </Link>

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-lg border border-[#dbe4f0] bg-white">
            <p className="text-sm font-semibold text-[#64748b]">
              가입 신청 목록을 불러오는 중입니다.
            </p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-lg border border-[#fecaca] bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-bold text-[#0f172a]">
              가입 신청 목록을 볼 수 없습니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#b91c1c]">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadJoinRequests()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#435f88]"
            >
              다시 시도
            </button>
          </section>
        ) : teamDetail && canManageJoinRequests ? (
          <>
            <section className="flex flex-col gap-4 border-b border-[#dbe4f0] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#4f6f9f]">
                  {teamDetail.team.shortName || "JOIN REQUESTS"}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-[#0f172a] sm:text-4xl">
                  가입 신청 관리
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#64748b]">
                  {teamDetail.team.name}에 가입을 요청한 사용자를 확인하고 처리하세요.
                </p>
              </div>
              <span className="inline-flex h-10 w-fit items-center rounded-md border border-[#b9c9df] bg-white px-3 text-sm font-semibold text-[#3d5b86]">
                대기 {requests.length}명
              </span>
            </section>

            {noticeMessage ? (
              <p className="rounded-md border border-[#c8d4e6] bg-[#f0f4fa] px-4 py-3 text-sm font-medium text-[#3d5b86]">
                {noticeMessage}
              </p>
            ) : null}

            {requests.length === 0 ? (
              <section className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-[#c8d4e6] bg-white px-5 py-12 text-center">
                <div>
                  <h2 className="text-xl font-bold text-[#0f172a]">
                    대기 중인 가입 신청이 없습니다.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#64748b]">
                    새 신청이 들어오면 이 화면에서 바로 승인하거나 거부할 수 있습니다.
                  </p>
                </div>
              </section>
            ) : (
              <section className="divide-y divide-[#e2e8f0] overflow-hidden rounded-lg border border-[#dbe4f0] bg-white">
                {requests.map((request) => {
                  const isProcessing = processingMemberId === request.id;

                  return (
                    <article
                      key={request.id}
                      className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-[#1f2937]">
                          {request.name ?? "이름 없는 신청자"}
                        </h2>
                        <p className="mt-1 text-sm text-[#64748b]">
                          신청 시각 {formatRequestedAt(request.requestedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => void handleJoinRequest(request, "reject")}
                          disabled={isProcessing}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-[#fecaca] bg-white px-4 text-sm font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:bg-[#fff7f7]"
                        >
                          거부
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleJoinRequest(request, "approve")}
                          disabled={isProcessing}
                          className="inline-flex h-10 items-center justify-center rounded-md bg-[#4f6f9f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#435f88] disabled:cursor-not-allowed disabled:bg-[#a9b9d3]"
                        >
                          {isProcessing ? "처리 중..." : "승인"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
