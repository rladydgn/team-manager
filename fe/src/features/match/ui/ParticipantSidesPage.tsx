"use client";

import { PlayerProfileBadges } from "@/features/team/ui/PlayerProfileBadges";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getParticipantSides, sideLabels, updateParticipantSides, type ParticipantSide, type ParticipantSides } from "../api/formations";
import { useUnsavedChanges } from "../model/use-unsaved-changes";
import { ApiRequestError } from "@/shared/api/http";
import { isPageAccessFailure } from "@/features/auth/model/page-access";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { PageHeading } from "@/shared/ui/PageHeading";
import { FormationError, FormationLoading } from "./FormationPages";

export function ParticipantSidesPage({ matchId }: { matchId: number }) {
  const [data, setData] = useState<ParticipantSides | null>(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const refresh = useCallback(async () => {
    setError("");
    try {
      const response = await getParticipantSides(matchId);
      if (!response.data) throw new Error("편 배정 정보를 받지 못했어요.");
      setData(response.data); return response.data;
    } catch (error) {
      if (error instanceof ApiRequestError && isPageAccessFailure(error.status)) { setMissing(true); setData(null); }
      setError(error instanceof Error ? error.message : "편 배정을 불러오지 못했어요."); return null;
    }
  }, [matchId]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  if (missing) return <NotFoundPage />;
  return <main className="flex-1 bg-canvas"><div className="page-shell max-w-4xl">
    <Link href={`/match/${matchId}/formations`} className="w-fit text-sm text-brand-ink">← 포메이션</Link>
    <PageHeading title="편 배정 관리" description="편 배정은 이 경기의 모든 포메이션에 적용돼요." />
    <p className="text-sm leading-6 text-muted">기존 경기의 참가자는 홈으로 배정되어 있을 수 있어요. 배정을 확인해 주세요.</p>
    {error && <FormationError message={error} retry={() => void refresh()} />}
    {!data && !error && <FormationLoading />}
    {data && <SideEditor data={data} refresh={refresh} />}
  </div></main>;
}

function SideEditor({ data, refresh }: { data: ParticipantSides; refresh: () => Promise<ParticipantSides | null> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<number, ParticipantSide>>(() => Object.fromEntries(data.players.map((player) => [player.teamMemberId, player.side])));
  const [baseline, setBaseline] = useState(data);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [needsReview, setNeedsReview] = useState(false);
  const assignments = Object.entries(draft).filter(([id, side]) => baseline.players.find((player) => player.teamMemberId === Number(id))?.side !== side)
    .map(([id, side]) => ({ teamMemberId: Number(id), side }));
  const allowLeave = useUnsavedChanges(assignments.length > 0);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !assignments.length || needsReview || !data.canManage) return;
    if (!window.confirm("편 배정을 바꾸면 기존 포메이션의 일부 배치가 제외될 수 있어요.")) return;
    setSaving(true); setError("");
    try {
      await updateParticipantSides(data.matchId, baseline.version, assignments);
      allowLeave(); router.push(`/match/${data.matchId}/formations?saved=sides`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "편 배정을 저장하지 못했어요.");
      setNeedsReview(true); await refresh();
    } finally { setSaving(false); }
  }
  async function reload() {
    if (!window.confirm("작성 중인 편 배정을 버리고 최신 내용으로 바꿀까요?")) return;
    const latest = await refresh();
    if (!latest) return;
    setBaseline(latest); setDraft(Object.fromEntries(latest.players.map((player) => [player.teamMemberId, player.side])));
    setNeedsReview(false); setError("");
  }
  return <form onSubmit={(event) => void save(event)} className="surface-card p-4 sm:p-6">
    {!data.canManage && <p className="mb-4 text-sm text-muted">취소된 경기에서는 편 배정을 변경할 수 없어요.</p>}
    <p className="mb-4 text-sm font-medium text-brand-ink">{(["UNASSIGNED", "HOME", "AWAY"] as const).map((side) => `${sideLabels[side]} ${data.players.filter((player) => (draft[player.teamMemberId] ?? player.side) === side).length}명`).join(" · ")}</p>
    {!data.players.length ? <p className="py-6 text-sm text-muted">참석 투표한 선수가 없어요.</p> : <div className="divide-y divide-line">
      {data.players.map((player) => <label key={player.teamMemberId} className="flex min-w-0 items-center justify-between gap-3 py-3">
        <span className="min-w-0 break-words text-sm font-medium">{player.name}<span className="mt-1 block"><PlayerProfileBadges {...player} /></span></span>
        <select aria-label={`${player.name}, 팀원 #${player.teamMemberId} 편`} className="field w-28 shrink-0 sm:w-36" disabled={saving || !data.canManage}
          value={draft[player.teamMemberId] ?? player.side} onChange={(event) => setDraft({ ...draft, [player.teamMemberId]: event.target.value as ParticipantSide })}>
          <option value="UNASSIGNED">미배정</option><option value="HOME">홈</option><option value="AWAY">어웨이</option>
        </select>
      </label>)}
    </div>}
    {error && <p role="alert" className="mt-4 rounded-lg bg-danger-soft p-4 text-sm text-danger">{error}</p>}
    {needsReview && <div className="mt-4"><p className="text-sm text-muted">입력 내용은 유지했어요. 최신 명단을 확인한 뒤 다시 배정해 주세요.</p><button type="button" className="btn-secondary mt-2" onClick={() => void reload()}>최신 편 배정 불러오기</button></div>}
    <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
      <Link href={`/match/${data.matchId}/formations`} className="btn-secondary">취소</Link>
      <button type="submit" className="btn-primary" disabled={!data.canManage || !assignments.length || saving || needsReview}>{saving ? "저장 중…" : "편 배정 저장"}</button>
    </div>
  </form>;
}
