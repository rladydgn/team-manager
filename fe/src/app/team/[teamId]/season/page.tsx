"use client";

import Link from "next/link";
import { DragEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthSession } from "@/features/auth/model/auth-session";
import { deleteTeamSeason, updateTeamSeason, getTeamSeasons, reorderTeamSeasons, setDefaultTeamSeason, type TeamSeason, type TeamSeasonCreateRequest } from "@/features/team/api/season";
import { getTeam, type Team } from "@/features/team/api/team";

export default function TeamSeasonSettingsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Number(params.teamId);
  const { currentUser, isSessionReady } = useAuthSession();
  const [team, setTeam] = useState<Team | null>(null);
  const [seasons, setSeasons] = useState<TeamSeason[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [replacementId, setReplacementId] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    if (!isSessionReady || !currentUser) return;
    try {
      const [teamResponse, seasonResponse] = await Promise.all([getTeam(teamId), getTeamSeasons(teamId)]);
      const member = teamResponse.data?.members.find((item) => item.userId === currentUser.id);
      if (member?.role !== "OWNER" && member?.role !== "SUB_MANAGER") {
        setErrorMessage("운영진만 시즌 설정을 변경할 수 있습니다.");
        return;
      }
      setTeam(teamResponse.data?.team ?? null);
      setSeasons(seasonResponse.data ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "시즌 정보를 불러오지 못했습니다.");
    }
  }, [currentUser, isSessionReady, teamId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timerId);
  }, [load]);

  async function saveChanges(seasonId: number, request: TeamSeasonCreateRequest) {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = await updateTeamSeason(teamId, seasonId, request);
      if (!response.data) throw new Error("시즌 목록을 받지 못했습니다. 다시 시도해주세요.");
      setSeasons(response.data);
      setEditingId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "시즌을 수정하지 못했습니다.");
    } finally { setIsSaving(false); }
  }

  async function confirmDelete(season: TeamSeason) {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = await deleteTeamSeason(teamId, season.id, season.isDefault && seasons.length > 1 ? Number(replacementId) : undefined);
      if (!response.data) throw new Error("시즌 목록을 받지 못했습니다. 다시 불러와 확인해주세요.");
      setSeasons(response.data);
      setDeletingId(null);
      setReplacementId("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "시즌을 삭제하지 못했습니다.");
    } finally { setIsSaving(false); }
  }

  async function saveOrder(next: TeamSeason[]) {
    const previous = seasons;
    setSeasons(next);
    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = await reorderTeamSeasons(teamId, next.map((season) => season.id));
      setSeasons(response.data ?? next);
    } catch (error) {
      setSeasons(previous);
      setErrorMessage(error instanceof Error ? error.message : "시즌 순서를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function moveSeason(seasonId: number, direction: -1 | 1) {
    const defaultSeason = seasons.find((season) => season.isDefault);
    const movable = seasons.filter((season) => !season.isDefault);
    const index = movable.findIndex((season) => season.id === seasonId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= movable.length) return;
    const nextMovable = [...movable];
    [nextMovable[index], nextMovable[target]] = [nextMovable[target], nextMovable[index]];
    void saveOrder(defaultSeason ? [defaultSeason, ...nextMovable] : nextMovable);
  }

  function dropOn(event: DragEvent<HTMLLIElement>, targetId: number) {
    event.preventDefault();
    if (draggedId === null || draggedId === targetId || isSaving) return;
    const defaultSeason = seasons.find((season) => season.isDefault);
    const movable = seasons.filter((season) => !season.isDefault);
    const from = movable.findIndex((season) => season.id === draggedId);
    const to = movable.findIndex((season) => season.id === targetId);
    if (from < 0 || to < 0) return;
    const nextMovable = [...movable];
    const [moved] = nextMovable.splice(from, 1);
    nextMovable.splice(to, 0, moved);
    setDraggedId(null);
    void saveOrder(defaultSeason ? [defaultSeason, ...nextMovable] : nextMovable);
  }

  async function makeDefault(seasonId: number) {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const response = await setDefaultTeamSeason(teamId, seasonId);
      setSeasons(response.data ?? seasons);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "기본 시즌을 변경하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4rem-1px)] bg-canvas px-5 py-8 text-ink sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-brand">시즌 관리</p><h1 className="mt-2 text-3xl font-semibold text-ink">{team?.name ?? "팀"} 시즌 설정</h1><p className="mt-3 text-sm text-muted">기본 시즌은 항상 첫 번째로 보입니다. 나머지는 끌어서 순서를 바꿀 수 있습니다. 이름·기간·메모 수정과 삭제도 가능합니다.</p></div>
          {team ? <Link href={`/team/${teamId}/season/new`} className="inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-brand px-5 text-sm font-semibold text-white">새 시즌 만들기</Link> : null}
        </div>
        {errorMessage ? <p role="alert" className="mt-5 rounded-lg border border-danger-line bg-white px-4 py-3 text-sm text-danger">{errorMessage}</p> : null}
        {team && seasons.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-line-strong bg-white px-5 py-14 text-center text-sm text-muted">아직 등록된 시즌이 없습니다.</div> : null}
        <ol className="mt-6 grid gap-3">
          {seasons.map((season, index) => {
            const movableIndex = seasons.filter((item) => !item.isDefault).findIndex((item) => item.id === season.id);
            const movableCount = seasons.filter((item) => !item.isDefault).length;
            return (
              <li key={season.id} draggable={!season.isDefault && !isSaving && editingId === null && deletingId === null} onDragStart={() => setDraggedId(season.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOn(event, season.id)} className={`rounded-xl border bg-white p-4 ${season.isDefault ? "border-brand ring-1 ring-brand-ring" : "border-line cursor-grab"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-placeholder">{index + 1}</span><h2 className="break-words font-semibold text-ink">{season.name}</h2>{season.isDefault ? <span className="rounded-full bg-brand-soft px-2 py-1 text-xs font-semibold text-brand-ink">기본</span> : null}</div><p className="mt-2 text-sm text-muted">{season.startDate} ~ {season.endDate}</p></div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" disabled={isSaving} onClick={() => { setEditingId(season.id); setDeletingId(null); setErrorMessage(""); }} className="btn-secondary">수정</button>
                    <button type="button" disabled={isSaving} onClick={() => { setDeletingId(season.id); setEditingId(null); setReplacementId(""); setErrorMessage(""); }} className="btn-secondary text-danger">삭제</button>
                    {!season.isDefault ? <><button type="button" aria-label={`${season.name} 위로 이동`} disabled={isSaving || editingId !== null || deletingId !== null || movableIndex === 0} onClick={() => moveSeason(season.id, -1)} className="h-9 rounded-lg border border-line-strong px-3 text-sm font-semibold text-secondary disabled:opacity-40">↑</button><button type="button" aria-label={`${season.name} 아래로 이동`} disabled={isSaving || editingId !== null || deletingId !== null || movableIndex === movableCount - 1} onClick={() => moveSeason(season.id, 1)} className="h-9 rounded-lg border border-line-strong px-3 text-sm font-semibold text-secondary disabled:opacity-40">↓</button><button type="button" disabled={isSaving || editingId !== null || deletingId !== null} onClick={() => void makeDefault(season.id)} className="h-9 rounded-lg border border-brand px-3 text-sm font-semibold text-brand-ink">기본으로 설정</button></> : <span className="text-xs font-semibold text-muted">위치 고정</span>}
                  </div>
                </div>
                {season.memo ? <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-secondary">{season.memo}</p> : null}
                {editingId === season.id ? <SeasonEditForm key={season.id} season={season} busy={isSaving} onCancel={() => setEditingId(null)} onSave={(request) => void saveChanges(season.id, request)} /> : null}
                {deletingId === season.id ? (
                  <div className="mt-4 rounded-lg border border-danger-line bg-danger-soft p-4">
                    <h3 className="font-semibold text-ink">이 시즌을 삭제할까요?</h3>
                    <p className="mt-2 text-sm leading-6 text-secondary">시즌은 목록에서 사라집니다. 경기·출석·개인 기록은 유지됩니다.</p>
                    {season.isDefault && seasons.length > 1 ? <label className="mt-4 grid gap-2 text-sm font-semibold text-secondary">대체 기본 시즌
                      <select value={replacementId} onChange={(event) => setReplacementId(event.target.value)} disabled={isSaving} className="h-11 w-full min-w-0 rounded-lg border border-line-strong bg-white px-3">
                        <option value="">대체할 시즌을 선택하세요</option>
                        {seasons.filter((item) => item.id !== season.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </label> : null}
                    {seasons.length === 1 ? <p className="mt-2 text-sm text-secondary">마지막 시즌입니다. 삭제 후 통계·순위에서 기간을 직접 선택할 수 있습니다.</p> : null}
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button type="button" disabled={isSaving} onClick={() => setDeletingId(null)} className="btn-secondary">취소</button>
                      <button type="button" disabled={isSaving || (season.isDefault && seasons.length > 1 && !replacementId)} onClick={() => void confirmDelete(season)} className="btn-secondary border-danger-line text-danger disabled:opacity-50">{isSaving ? "삭제 중..." : "시즌 삭제 확인"}</button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-brand-ink"><Link href={`/team/${teamId}/statistics`}>통계로 돌아가기</Link><Link href={`/team/${teamId}/ranking`}>순위로 돌아가기</Link></div>
      </div>
    </main>
  );
}

function SeasonEditForm({ season, busy, onSave, onCancel }: {
  season: TeamSeason; busy: boolean;
  onSave: (request: TeamSeasonCreateRequest) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(season.name);
  const [startDate, setStartDate] = useState(season.startDate);
  const [endDate, setEndDate] = useState(season.endDate);
  const [memo, setMemo] = useState(season.memo ?? "");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || startDate > endDate) return;
    onSave({ name: name.trim(), startDate, endDate, memo });
  }
  const fieldClass = "w-full min-w-0 rounded-lg border border-line-strong bg-white px-3 py-2 font-normal text-ink outline-none focus:border-brand";
  return <form onSubmit={submit} className="mt-4 grid gap-4 border-t border-line pt-4">
    <fieldset disabled={busy} className="grid min-w-0 gap-4">
      <label className="grid gap-2 text-sm font-semibold text-secondary">시즌 이름<input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} required className={fieldClass} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-semibold text-secondary">시작일<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required className={fieldClass} /></label>
        <label className="grid min-w-0 gap-2 text-sm font-semibold text-secondary">종료일<input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} required className={fieldClass} /></label>
      </div>
      <p className="text-sm leading-6 text-muted">기간을 바꾸면 통계·순위에 포함되는 경기가 달라집니다. 경기 기록 자체는 변경되지 않습니다.</p>
      <label className="grid gap-2 text-sm font-semibold text-secondary">시즌 메모 (선택)<textarea value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={1000} rows={4} placeholder="예: 이번 시즌 클린시트는 수미도 포함" className={fieldClass} />
        <span className="text-xs font-normal leading-5 text-muted">팀원에게 공개됩니다. 메모는 실제 집계 방식을 자동으로 바꾸지 않습니다. ({memo.length}/1,000)</span>
      </label>
      <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onCancel} className="btn-secondary">취소</button><button disabled={!name.trim() || startDate > endDate} className="btn-primary disabled:opacity-50">{busy ? "저장 중..." : "변경 저장"}</button></div>
    </fieldset>
  </form>;
}
