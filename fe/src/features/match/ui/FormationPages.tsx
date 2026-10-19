"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createFormation, deleteFormation, sideLabels, updateFormation, type Formation, type FormationCollection, type FormationInput } from "../api/formations";
import { draftPlacements, getBench, placePlayer, titleError } from "../model/formations";
import { useFormationData } from "../model/use-formation-data";
import { useUnsavedChanges } from "../model/use-unsaved-changes";
import { ApiRequestError } from "@/shared/api/http";
import { NotFoundPage } from "@/shared/ui/NotFoundPage";
import { PageHeading } from "@/shared/ui/PageHeading";
import { FormationPitch } from "./FormationPitch";
import { FormationSideSummary } from "./FormationSideSummary";

export function FormationLoading() { return <p role="status" className="p-10 text-center text-sm text-muted">포메이션을 불러오는 중이에요.</p>; }
export function FormationError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft p-4 text-sm text-danger">
    <p>{message}</p><button type="button" className="btn-secondary mt-3" onClick={retry}>다시 불러오기</button>
  </div>;
}
const inputFrom = (formation?: Formation): FormationInput => formation ? {
  title: formation.title, side: formation.side, templateId: formation.templateId, version: formation.version,
  placements: formation.placements.map(({ slotId, teamMemberId }) => ({ slotId, teamMemberId })),
} : { title: "", side: "HOME", templateId: "4-4-2", placements: [] };

export function FormationPage({ matchId, mode = "view", formationId }: { matchId: number; mode?: "view" | "new" | "edit"; formationId?: number }) {
  const query = useSearchParams();
  const router = useRouter();
  const selection = mode === "view" ? query.get("formationId") ?? "" : "";
  const { data, match, loading, error, missing, refresh } = useFormationData(matchId, selection);
  const [notice, setNotice] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const selected = data?.formations.find((item) => item.id === Number(selection)) ?? data?.formations[0];
  const editing = data?.formations.find((item) => item.id === formationId);
  const basePath = `/match/${matchId}/formations`;
  useEffect(() => {
    if (mode !== "view" || !data || loading || !selection || data.formations.some((item) => String(item.id) === selection)) return;
    router.replace(`${basePath}${data.formations[0] ? `?formationId=${data.formations[0].id}` : ""}`, { scroll: false });
    const timer = window.setTimeout(() => setNotice("선택한 포메이션이 없어 첫 항목을 표시해요."), 0);
    return () => window.clearTimeout(timer);
  }, [basePath, data, loading, mode, router, selection]);

  if (missing || (data && mode === "edit" && !editing) || (data && mode !== "view" && !data.permissions.canDelete)) return <NotFoundPage />;
  const savedNotice = query.get("saved") === "sides" ? "편 배정을 저장했어요." : query.get("saved") === "formation" ? "포메이션을 저장했어요." : "";
  async function remove() {
    if (!selected || !data || deleting) return;
    const suffix = data.matchType === "INTERNAL" ? ` (${sideLabels[selected.side]})` : "";
    if (!window.confirm(`‘${selected.title}’${suffix} 포메이션을 삭제할까요?`)) return;
    setDeleting(true); setDeleteError("");
    try {
      await deleteFormation(matchId, selected.id, selected.version);
      const index = data.formations.findIndex((item) => item.id === selected.id);
      const next = data.formations[index + 1] ?? data.formations[index - 1];
      await refresh();
      router.replace(`${basePath}${next ? `?formationId=${next.id}` : ""}`, { scroll: false });
      setNotice("포메이션을 삭제했어요.");
    } catch (error) { setDeleteError(error instanceof Error ? error.message : "삭제하지 못했어요."); await refresh(); }
    finally { setDeleting(false); }
  }

  return <main className="flex-1 bg-canvas"><div className="page-shell">
    <Link href={`/match/${matchId}`} className="w-fit text-sm font-medium text-brand-ink">← 경기 상세</Link>
    <PageHeading title={mode === "view" ? "포메이션" : mode === "new" ? "포메이션 추가" : "포메이션 수정"}
      label={match ? `${new Date(match.matchAt).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} · ${match.matchType === "INTERNAL" ? "자체 경기" : match.opponentTeamName ?? "외부 경기"}` : undefined}
      description={mode === "view" ? "탭을 선택해 쿼터별 선수 배치와 후보를 확인하세요." : "참석 투표한 선수로 배치를 준비하고 저장하세요."}
      action={mode === "view" && data ? <>
        <button type="button" className="btn-secondary" disabled={loading || deleting} onClick={() => void refresh()}>{loading ? "불러오는 중…" : "새로고침"}</button>
        {data.permissions.canUpdate && (data.permissions.canCreate ? <Link href={`${basePath}/new`} className="btn-primary">포메이션 추가</Link> : <button type="button" className="btn-primary" disabled>포메이션 추가</button>)}
      </> : undefined} />
    {(notice || savedNotice) && <p role="status" className="rounded-lg bg-brand-soft p-4 text-sm text-brand-ink">{notice || savedNotice}</p>}
    {error && <FormationError message={error} retry={() => void refresh()} />}
    {!data && loading && <FormationLoading />}
    {data && <>
      {data.matchStatus === "CANCELED" && <p className="text-sm text-muted">취소된 경기예요. 포메이션 조회와 삭제만 가능해요.</p>}
      {data.formations.length >= data.maxFormations && <p className="text-sm text-muted">포메이션은 경기당 최대 10개까지 만들 수 있어요.</p>}
      {mode === "view" ? <>
        {data.matchType === "INTERNAL" && <FormationSideSummary matchId={matchId} players={data.attendingPlayers} canManage={data.permissions.canAssignSides} />}
        {deleteError && <FormationError message={deleteError} retry={() => { setDeleteError(""); void refresh(); }} />}
        {!data.formations.length ? <section className="surface-card p-10 text-center text-sm text-muted">아직 등록된 포메이션이 없어요.</section> : <section className="surface-card min-w-0 p-3 sm:p-6">
          <div role="tablist" aria-label="저장된 포메이션" className="mb-6 flex flex-wrap gap-2 border-b border-line pb-4">
            {data.formations.map((formation, index) => <button key={formation.id} type="button" role="tab" id={`formation-tab-${formation.id}`}
              aria-controls="formation-panel" aria-selected={selected?.id === formation.id} tabIndex={selected?.id === formation.id ? 0 : -1}
              disabled={deleting} className={`min-h-11 min-w-0 max-w-full rounded-lg border px-4 py-2 text-left text-sm ${selected?.id === formation.id ? "border-brand bg-brand-soft font-semibold text-brand-ink" : "border-line text-secondary hover:bg-subtle"}`}
              onClick={() => { setDeleteError(""); router.replace(`${basePath}?formationId=${formation.id}`, { scroll: false }); }}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === "ArrowRight") next = (index + 1) % data.formations.length;
                else if (event.key === "ArrowLeft") next = (index - 1 + data.formations.length) % data.formations.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = data.formations.length - 1;
                else return;
                event.preventDefault();
                document.getElementById(`formation-tab-${data.formations[next].id}`)?.focus();
                router.replace(`${basePath}?formationId=${data.formations[next].id}`, { scroll: false });
              }}>
              <span className="block max-w-52 truncate" title={formation.title}>{formation.title}</span>
              <span className="mt-1 block text-xs font-normal">{data.matchType === "INTERNAL" ? `${sideLabels[formation.side]} · ` : ""}{formation.templateId}</span>
            </button>)}
          </div>
          {selected && <div role="tabpanel" id="formation-panel" aria-labelledby={`formation-tab-${selected.id}`} aria-busy={loading}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{selected.title}{data.matchType === "INTERNAL" && <span className="ml-2 status-badge">{sideLabels[selected.side]}</span>}</h2>
                <p className="mt-2 text-sm text-muted">{selected.templateId} · 배치 {selected.placements.filter((item) => item.eligible).length}/11명 · 후보 {getBench(data.attendingPlayers, selected.placements, selected.side).length}명</p></div>
              <div className="flex flex-wrap gap-2">
                {data.permissions.canUpdate && <Link href={`${basePath}/${selected.id}/edit`} className="btn-secondary">수정</Link>}
                {data.permissions.canDelete && <button type="button" disabled={deleting || loading} onClick={() => void remove()} className="btn-quiet text-danger">{deleting ? "삭제 중…" : "삭제"}</button>}
              </div>
            </div>
            {selected.placements.some((item) => !item.eligible) && <p className="mb-5 rounded-lg bg-danger-soft p-3 text-sm text-danger">참석 명단 또는 편 배정이 바뀌었어요. 제외된 선수의 배치를 수정해 주세요.</p>}
            {!data.attendingPlayers.length && <p className="mb-4 text-sm text-muted">참석 투표한 선수가 없어요.</p>}
            {data.templates.find((item) => item.id === selected.templateId) && <FormationPitch key={selected.id} template={data.templates.find((item) => item.id === selected.templateId)!}
              placements={selected.placements} players={data.attendingPlayers.filter((player) => player.side === selected.side)} bench={getBench(data.attendingPlayers, selected.placements, selected.side)} />}
          </div>}
        </section>}
      </> : <FormationEditor key={formationId ?? "new"} data={data} initial={editing} refresh={refresh} />}
    </>}
  </div></main>;
}

function FormationEditor({ data, initial, refresh }: { data: FormationCollection; initial?: Formation; refresh: () => Promise<FormationCollection | null> }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => inputFrom(initial));
  const [baseline, setBaseline] = useState(() => JSON.stringify(inputFrom(initial)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const allowLeave = useUnsavedChanges(JSON.stringify(draft) !== baseline);
  const path = `/match/${data.matchId}/formations`;
  const placements = draftPlacements(draft, data.attendingPlayers, initial?.placements);
  const template = data.templates.find((template) => template.id === draft.templateId)!;
  const invalid = placements.some((placement) => !placement.eligible);
  const fieldError = titleError(draft.title);
  const canSave = initial ? data.permissions.canUpdate : data.permissions.canCreate;
  function changeLayout(key: "templateId" | "side", value: string) {
    if (draft[key] === value) return;
    if (draft.placements.length && !window.confirm(key === "side" ? "편을 바꾸면 배치한 선수가 모두 후보로 이동해요." : "포메이션을 바꾸면 배치한 선수가 모두 후보로 이동해요.")) return;
    setDraft({ ...draft, [key]: value, placements: [] });
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !canSave || invalid || conflict || uncertain) return;
    if (fieldError) { setError(fieldError); return; }
    setSaving(true); setError("");
    try {
      const request = { ...draft, title: draft.title.trim() };
      const result = initial ? await updateFormation(data.matchId, initial.id, request) : await createFormation(data.matchId, request);
      if (!result.data) throw new Error("저장 결과를 확인하지 못했어요.");
      allowLeave(); router.push(`${path}?formationId=${result.data.id}&saved=formation`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "저장하지 못했어요.");
      setConflict(error instanceof ApiRequestError && error.code === "MATCH_FORMATION_VERSION_CONFLICT");
      if (!initial && (!(error instanceof ApiRequestError) || error.status >= 500)) setUncertain(true);
      await refresh();
    } finally { setSaving(false); }
  }
  async function reloadDraft() {
    if (!window.confirm("작성 중인 내용을 버리고 최신 저장 내용으로 바꿀까요?")) return;
    const latest = await refresh();
    if (!latest) return;
    const updated = inputFrom(latest.formations.find((item) => item.id === initial?.id));
    setDraft(updated); setBaseline(JSON.stringify(updated)); setConflict(false); setError("");
  }
  return <form onSubmit={(event) => void save(event)} className="surface-card min-w-0 p-3 sm:p-6">
    <fieldset disabled={saving || !canSave} className="min-w-0">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <label className="min-w-0 text-sm font-medium sm:col-span-2">제목 <span className="text-muted">· 필수</span>
          <input className="field mt-2" value={draft.title} maxLength={50} placeholder="예: 1쿼터" aria-describedby="formation-title-error"
            onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          <span id="formation-title-error" className="mt-1 block text-xs text-danger">{draft.title && fieldError}</span>
        </label>
        {data.matchType === "INTERNAL" && <label className="text-sm font-medium">편<select className="field mt-2" value={draft.side} onChange={(event) => changeLayout("side", event.target.value)}><option value="HOME">홈</option><option value="AWAY">어웨이</option></select></label>}
        <label className="text-sm font-medium">프리셋<select className="field mt-2" value={draft.templateId} onChange={(event) => changeLayout("templateId", event.target.value)}>{data.templates.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
      {data.matchType === "INTERNAL" && data.attendingPlayers.some((player) => player.side === "UNASSIGNED") && <p className="mb-4 text-sm leading-6 text-muted">편을 배정하면 선수를 선택할 수 있어요. <Link className="text-brand-ink underline" href={`${path}/sides`}>편 배정 관리</Link></p>}
      {!data.attendingPlayers.length ? <p className="mb-4 text-sm text-muted">참석 투표한 선수가 없어요. 빈 포메이션도 저장할 수 있어요.</p> : !data.attendingPlayers.some((player) => player.side === draft.side) && <p className="mb-4 text-sm text-muted">이 편에 배정된 참석 선수가 없어요.</p>}
      <p className="mb-4 text-sm text-muted">배치 {placements.filter((item) => item.eligible).length}/11명 · 후보 {getBench(data.attendingPlayers, placements, draft.side).length}명</p>
      {invalid && <p role="alert" className="mb-4 rounded-lg bg-danger-soft p-3 text-sm text-danger">참석 명단 또는 편 배정이 바뀌었어요. 제외된 선수의 배치를 해제하거나 교체해 주세요.</p>}
      <FormationPitch template={template} placements={placements} players={data.attendingPlayers.filter((player) => player.side === draft.side)} bench={getBench(data.attendingPlayers, placements, draft.side)}
        onPlace={(slotId, id) => setDraft((draft) => ({ ...draft, placements: placePlayer(draft.placements, slotId, id) }))}
        onRemove={(slotId) => setDraft((draft) => ({ ...draft, placements: draft.placements.filter((placement) => placement.slotId !== slotId) }))} />
    </fieldset>
    {error && <p role="alert" className="mt-5 rounded-lg bg-danger-soft p-4 text-sm text-danger">{error}</p>}
    {conflict && <button type="button" className="btn-secondary mt-3" onClick={() => void reloadDraft()}>최신 저장 내용 불러오기</button>}
    {uncertain && <div className="mt-4 text-sm leading-6 text-muted"><p>저장됐을 수 있어요. 목록에서 저장 여부를 먼저 확인해 주세요. 같은 제목만으로는 저장 여부를 알 수 없어요.</p>
      <Link href={path} target="_blank" className="btn-secondary mt-2">목록 확인</Link>
      <button type="button" className="btn-quiet" onClick={() => { if (window.confirm("목록을 확인했고 저장되지 않은 것이 확실한가요?")) setUncertain(false); }}>확인 후 다시 작성</button>
    </div>}
    <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
      <Link href={`${path}${initial ? `?formationId=${initial.id}` : ""}`} className="btn-secondary">취소</Link>
      <button type="submit" className="btn-primary" disabled={saving || !canSave || invalid || conflict || uncertain || Boolean(fieldError)}>{saving ? "저장 중…" : "저장"}</button>
    </div>
  </form>;
}
