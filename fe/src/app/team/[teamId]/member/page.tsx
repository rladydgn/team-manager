"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useCurrentUser } from "@/features/auth/model/auth-session";
import {
  getTeam,
  getTeamMembers,
  addTeamMember,
  deleteTeamMemberMemo,
  removeTeamMember,
  TeamDetail,
  TeamMember,
  PlayerPosition,
  updateTeamMemberMemo,
  updateTeamMemberRole,
} from "@/features/team/api/team";
import { PageHeading } from "@/shared/ui/PageHeading";
import { TeamDetailTabs } from "@/features/team/ui/TeamDetailTabs";
import { PlayerProfileFields } from "@/features/team/ui/PlayerProfileFields";
import { PlayerProfileCells } from "@/features/team/ui/PlayerProfileCells";

const roleLabels: Record<TeamMember["role"], string> = {
  OWNER: "팀장",
  SUB_MANAGER: "부팀장",
  MEMBER: "팀원",
  GUEST: "용병",
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
  const [displayName, setDisplayName] = useState("");
  const [mainPosition, setMainPosition] = useState<PlayerPosition | "">("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [memberRole, setMemberRole] = useState<"MEMBER" | "GUEST">("GUEST");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [changingRoleMemberId, setChangingRoleMemberId] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);

  const loadTeam = useCallback(async () => {
    if (!Number.isInteger(teamId) || teamId <= 0) {
      setErrorMessage("올바르지 않은 팀 주소입니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [teamResponse, membersResponse] = await Promise.all([
        getTeam(teamId),
        getTeamMembers(teamId),
      ]);

      if (!teamResponse.data) {
        throw new Error("팀 정보를 받지 못했습니다.");
      }

      setTeamDetail({
        ...teamResponse.data,
        members: membersResponse.data ?? [],
      });
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

  const members = teamDetail?.members ?? [];
  const canManageFees = teamDetail?.members.some(
    (member) =>
      member.userId === currentUser?.id &&
      (member.role === "OWNER" || member.role === "SUB_MANAGER")
  ) ?? false;
  const canManageRoles = teamDetail?.members.some(
    (member) => member.userId === currentUser?.id && member.role === "OWNER"
  ) ?? false;
  const currentMember = teamDetail?.members.find(
    (member) => member.userId === currentUser?.id
  );
  const isTeamMember = teamDetail?.members.some(
    (member) => member.userId === currentUser?.id
  ) ?? false;

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManageFees || !displayName.trim()) return;

    setIsAddingMember(true);
    setErrorMessage("");
    try {
      await addTeamMember(teamId, {
        displayName: displayName.trim(), role: memberRole,
        mainPosition: mainPosition || null, jerseyNumber: jerseyNumber === "" ? null : Number(jerseyNumber),
      });
      setDisplayName("");
      setMainPosition("");
      setJerseyNumber("");
      await loadTeam();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "팀원을 추가하지 못했습니다.");
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleMemo(member: TeamMember) {
    if (!canManageFees) return;
    const memo = window.prompt("팀원 메모", member.memo ?? "");
    if (memo === null) return;

    try {
      if (memo.trim()) {
        await updateTeamMemberMemo(teamId, member.id, memo.trim());
      } else if (member.memo) {
        await deleteTeamMemberMemo(teamId, member.id);
      }
      await loadTeam();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "팀원 메모를 저장하지 못했습니다.");
    }
  }

  async function handleRoleChange(member: TeamMember, role: TeamMember["role"]) {
    if (!canManageRoles || member.role === "OWNER" || member.role === role) return;

    if (
      role === "OWNER" &&
      !window.confirm(
        `${member.name ?? "선택한 팀원"}님을 팀장으로 변경할까요?\n현재 팀장은 부팀장으로 변경됩니다.`
      )
    ) {
      return;
    }

    setChangingRoleMemberId(member.id);
    setErrorMessage("");
    try {
      await updateTeamMemberRole(teamId, member.id, { role });
      await loadTeam();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "팀원 역할을 변경하지 못했습니다.");
    } finally {
      setChangingRoleMemberId(null);
    }
  }

  function canRemoveMember(member: TeamMember) {
    if (!currentMember || member.role === "OWNER") {
      return false;
    }

    if (currentMember.role === "OWNER") {
      return member.id !== currentMember.id;
    }

    return (
      currentMember.role === "SUB_MANAGER" &&
      (member.role === "MEMBER" || member.role === "GUEST")
    );
  }

  async function handleRemoveMember(member: TeamMember) {
    if (!canRemoveMember(member)) return;

    const memberName = member.name ?? "선택한 팀원";
    if (
      !window.confirm(
        `${memberName}님을 팀에서 내보낼까요?\n과거 경기 기록과 회비 기록은 유지됩니다.`
      )
    ) {
      return;
    }

    setRemovingMemberId(member.id);
    setErrorMessage("");
    try {
      await removeTeamMember(teamId, member.id);
      await loadTeam();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "팀원을 내보내지 못했습니다.");
    } finally {
      setRemovingMemberId(null);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas text-ink">

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        {Number.isInteger(teamId) && teamId > 0 ? (
          <TeamDetailTabs
            teamId={teamId}
            activeTab="members"
            canAccessTeamFeatures={isTeamMember}
            canManageFees={canManageFees}
          />
        ) : null}

        {isLoading ? (
          <section className="flex min-h-72 items-center justify-center rounded-xl border border-line bg-white">
            <p className="text-sm font-semibold text-muted">팀원 목록을 불러오는 중입니다.</p>
          </section>
        ) : errorMessage && !teamDetail ? (
          <section className="rounded-xl border border-danger-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">팀원 목록을 불러올 수 없습니다.</h1>
            <p className="mt-3 text-sm leading-6 text-danger">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void loadTeam()}
              className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              다시 시도
            </button>
          </section>
        ) : teamDetail && !isTeamMember ? (
          <section className="rounded-xl border border-line bg-white px-5 py-12 text-center">
            <h1 className="text-xl font-semibold text-ink">
              팀 가입 후 이용할 수 있습니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              팀원 목록은 가입이 승인된 팀원에게만 제공됩니다.
            </p>
            <Link
              href={`/team/${teamId}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              팀 홈으로 돌아가기
            </Link>
          </section>
        ) : teamDetail ? (
          <>
            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <PageHeading label={teamDetail.team.name} title="팀원" description="팀원의 주포지션, 등번호와 가입 정보를 확인하세요." />
              <span className="w-fit rounded-lg border border-line-strong bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-ink">
                총 {members.length}명
              </span>
            </section>

            {errorMessage && <p role="alert" className="text-sm text-danger">{errorMessage}</p>}
            {canManageFees ? (
              <form onSubmit={handleAddMember} className="grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <label className="grid gap-1.5 text-sm font-semibold text-secondary">
                  용병·비회원 이름
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={50} required placeholder="표시할 이름" className="h-10 rounded-lg border border-line-strong px-3 font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring" />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-secondary">
                  구분
                  <select value={memberRole} onChange={(event) => setMemberRole(event.target.value as "MEMBER" | "GUEST")} className="h-10 rounded-lg border border-line-strong bg-white px-3 font-normal outline-none focus:border-brand">
                    <option value="GUEST">용병</option>
                    <option value="MEMBER">비회원 팀원</option>
                  </select>
                </label>
                <div className="sm:col-span-3 sm:row-start-2">
                  <fieldset disabled={isAddingMember}>
                    <PlayerProfileFields mainPosition={mainPosition} jerseyNumber={jerseyNumber} onPositionChange={setMainPosition} onNumberChange={setJerseyNumber} />
                  </fieldset>
                  <p className="mt-2 text-xs text-muted">등번호는 0~99이며 같은 팀에서 중복으로 사용할 수 있습니다.</p>
                </div>
                <button type="submit" disabled={isAddingMember || !displayName.trim()} className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-brand-disabled sm:col-start-3 sm:row-start-1">
                  {isAddingMember ? "추가 중..." : "팀원 추가"}
                </button>
              </form>
            ) : null}

            {canManageFees && <p className="text-xs leading-5 text-muted">주포지션은 선택하면, 등번호는 입력 후 다른 곳을 누르거나 Enter를 누르면 저장됩니다. 미설정을 선택하거나 등번호를 비우면 기존 값이 삭제됩니다.</p>}
            <section className="rounded-xl border border-line bg-white">
              {members.length === 0 ? (
                <div className="px-5 py-16 text-center text-sm text-muted">
                  아직 등록된 팀원이 없습니다.
                </div>
              ) : (
                <div>
                  <table className="block w-full text-left text-sm lg:table">
                    <thead className="sticky top-[calc(4rem+1px)] z-20 block bg-subtle text-xs font-semibold text-muted shadow-sm lg:table-header-group">
                      <tr className="grid grid-cols-[minmax(0,1fr)_6rem_5rem] lg:table-row">
                        <th scope="col" className="px-3 py-3 lg:px-5">이름</th>
                        <th scope="col" className="px-2 py-3">주포지션</th>
                        <th scope="col" className="px-2 py-3">등번호</th>
                        <th scope="col" className="hidden px-3 py-3 lg:table-cell">가입일</th>
                        <th scope="col" className="hidden px-3 py-3 lg:table-cell">메모</th>
                        <th scope="col" className="hidden px-3 py-3 text-right lg:table-cell">역할</th>
                        {canManageFees ? <th scope="col" className="hidden px-3 py-3 text-right lg:table-cell">관리</th> : null}
                      </tr>
                    </thead>
                    <tbody className="block divide-y divide-line lg:table-row-group">
                      {members.map((member) => (
                        <tr key={member.id} className="grid grid-cols-[minmax(0,1fr)_6rem_5rem] py-3 lg:table-row lg:py-0">
                          <td className="block min-w-0 px-3 py-2 font-semibold text-ink lg:table-cell lg:px-5 lg:py-4">
                            <span className="block break-words">
                            {member.name ?? (member.userId ? "가입 팀원" : "미가입 팀원")}
                            </span>
                          </td>
                          <PlayerProfileCells teamId={teamId} member={member} canEdit={canManageFees && removingMemberId !== member.id} onSaved={(updated) => {
                            setTeamDetail((detail) => detail ? { ...detail, members: detail.members.map((item) => item.id === updated.id ? updated : item) } : detail);
                          }} />
                          <td className="col-span-3 block px-3 py-2 text-muted lg:table-cell lg:py-4">
                            <span className="mr-2 lg:hidden">가입일</span>
                            {formatJoinedAt(member.joinedAt)}
                          </td>
                          <td className="col-span-3 block min-w-0 px-3 py-2 text-muted lg:table-cell lg:max-w-40 lg:py-4">
                            <p className="truncate"><span className="mr-2 lg:hidden">메모</span>{member.memo || "메모 없음"}</p>
                          </td>
                          <td className="col-span-3 block px-3 py-2 lg:table-cell lg:py-4 lg:text-right">
                            {canManageRoles && member.role !== "OWNER" ? (
                              <select
                                value={member.role}
                                disabled={changingRoleMemberId === member.id}
                                onChange={(event) =>
                                  void handleRoleChange(
                                    member,
                                    event.target.value as TeamMember["role"]
                                  )
                                }
                                aria-label={`${member.name ?? "팀원"} 역할`}
                                className="h-8 rounded-lg border border-line-strong bg-white px-2 text-xs font-semibold text-brand-ink outline-none focus:border-brand disabled:cursor-not-allowed disabled:bg-subtle"
                              >
                                <option value="MEMBER">{member.userId === null ? "팀원(비회원)" : "팀원"}</option>
                                <option value="GUEST">용병</option>
                                <option value="SUB_MANAGER" disabled={member.userId === null}>부팀장</option>
                                <option value="OWNER" disabled={member.userId === null}>팀장</option>
                              </select>
                            ) : (
                              <span className="inline-flex rounded-lg border border-line bg-subtle px-2.5 py-1 text-xs font-semibold text-brand-ink">
                                {member.role === "GUEST"
                                  ? "용병"
                                  : member.userId === null
                                    ? "팀원(비회원)"
                                    : roleLabels[member.role]}
                              </span>
                            )}
                          </td>
                          {canManageFees ? (
                            <td className="col-span-3 block px-3 py-2 lg:table-cell lg:py-4 lg:text-right">
                              <div className="flex flex-wrap gap-2 lg:justify-end">
                                <button type="button" onClick={() => void handleMemo(member)} disabled={removingMemberId === member.id} className="rounded-lg border border-line-strong bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60">
                                  메모 관리
                                </button>
                                {canRemoveMember(member) ? (
                                  <button type="button" onClick={() => void handleRemoveMember(member)} disabled={removingMemberId === member.id} className="rounded-lg border border-danger-line bg-white px-2.5 py-1 text-xs font-semibold text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60">
                                    {removingMemberId === member.id ? "내보내는 중" : "내보내기"}
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          ) : null}
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
