"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteTeamImage, getTeamImages, reorderTeamImages, uploadTeamImage, type TeamImage } from "../api/team-images";
import { API_BASE_URL } from "@/shared/config/api";
import { ApiRequestError } from "@/shared/api/http";
import { Icon } from "@/shared/ui/Icon";

function GalleryPhoto({ src, alt, className = "h-auto w-full" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="grid min-h-40 place-items-center gap-3 bg-subtle p-5 text-center text-sm text-muted">
    <p>이미지를 불러오지 못했습니다.</p><button type="button" className="btn-secondary" onClick={() => setFailed(false)}>다시 보기</button>
  </div>;
  return <Image src={src} alt={alt} width={1200} height={800} unoptimized className={className} onError={() => setFailed(true)} />;
}

function TeamPhotoViewer({ images, teamName }: { images: TeamImage[]; teamName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];
  if (!active) return null;
  function show(offset: number) { setActiveIndex((activeIndex + offset + images.length) % images.length); }
  return <div className="mt-4">
    <div className="relative overflow-hidden rounded-xl border border-line bg-canvas" aria-label="팀 사진 보기">
      <GalleryPhoto key={active.id} src={`${API_BASE_URL}${active.url}`} alt={`${teamName} 팀 사진 ${activeIndex + 1}`} className="h-56 w-full object-contain sm:h-80 lg:h-96" />
      {images.length > 1 && <>
        <button type="button" aria-label="이전 사진" className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-card transition-colors hover:bg-brand-soft" onClick={() => show(-1)}><Icon name="chevron" className="size-5 rotate-90" /></button>
        <button type="button" aria-label="다음 사진" className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-card transition-colors hover:bg-brand-soft" onClick={() => show(1)}><Icon name="chevron" className="size-5 -rotate-90" /></button>
      </>}
      <span className="absolute bottom-3 right-3 rounded-full bg-ink px-3 py-1 text-xs font-medium tabular-nums text-white" aria-live="polite">{activeIndex + 1} / {images.length}</span>
    </div>
    {images.length > 1 && <div className="mt-3 flex flex-wrap gap-2" aria-label="사진 선택 목록">
      {images.map((image, index) => <button key={image.id} type="button" aria-label={`${index + 1}번 팀 사진 보기`} aria-pressed={index === activeIndex}
        className={`relative overflow-hidden rounded-lg border-2 bg-subtle p-0.5 transition-colors ${index === activeIndex ? "border-brand" : "border-transparent hover:border-line-strong"}`} onClick={() => setActiveIndex(index)}>
        <Image src={`${API_BASE_URL}${image.url}`} alt="" width={88} height={56} unoptimized className="h-14 w-20 rounded object-contain" />
        {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-white px-1 text-[10px] font-medium text-brand-ink">대표</span>}
      </button>)}
    </div>}
  </div>;
}

export function TeamImageGallery({ teamId, teamName, canManage }: { teamId: number; teamName: string; canManage: boolean }) {
  const [images, setImages] = useState<TeamImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [managing, setManaging] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const previewRef = useRef("");
  const dragDepth = useRef(0);
  const isFull = images.length >= 3;
  const canChoose = !busy && !loading && !isFull;
  const showManagement = canManage && !loading && (managing || images.length === 0);

  const refresh = useCallback(async () => {
    try {
      const response = await getTeamImages(teamId);
      setImages(response.data ?? []);
      setError("");
      setDeletingId(null);
    } catch (error) { setError(error instanceof Error ? error.message : "이미지를 불러오지 못했습니다."); }
    finally { setLoading(false); }
  }, [teamId]);

  useEffect(() => {
    let active = true;
    void getTeamImages(teamId).then(response => {
      if (active) { setImages(response.data ?? []); setError(""); }
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : "이미지를 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [teamId]);
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  function clearSelection() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setPreview(""); setSelected(null);
    if (input.current) input.current.value = "";
  }

  function choose(file?: File) {
    clearSelection(); setError(""); setNotice("");
    if (!file) return;
    if (!/\.jpg$/i.test(file.name) || file.type !== "image/jpeg" || file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError("이미지는 5MB 이하의 JPG 파일만 등록할 수 있습니다."); return;
    }
    setSelected(file);
    previewRef.current = URL.createObjectURL(file);
    setPreview(previewRef.current);
  }

  async function mutate(action: () => ReturnType<typeof getTeamImages>, message: string, uploaded = false) {
    if (busy) return;
    setBusy(true); setUploading(uploaded); setError(""); setNotice("");
    try {
      const response = await action();
      if (!response.data) throw new Error("이미지 목록을 받지 못했습니다. 새로고침 후 확인해 주세요.");
      setImages(response.data); setDeletingId(null); setNotice(message);
      if (uploaded) clearSelection();
    } catch (error) {
      setError(error instanceof ApiRequestError && error.status === 413
        ? "서버의 업로드 용량 제한에 걸렸습니다. 서버 설정 확인이 필요합니다."
        : error instanceof Error ? error.message : "이미지를 저장하지 못했습니다.");
    }
    finally { setBusy(false); setUploading(false); }
  }

  function move(index: number, offset: number) {
    const current = images.map(image => image.id);
    const next = [...current];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    void mutate(() => reorderTeamImages(teamId, next, current), "이미지 순서를 변경했습니다.");
  }

  if (!loading && !error && !canManage && images.length === 0) return null;
  return <section className="surface-card p-5 sm:p-6" aria-labelledby="team-images-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="team-images-title" className="text-lg font-semibold">팀 사진{canManage && <span className="ml-2 text-sm font-normal text-muted">{images.length}/3장</span>}</h2>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className="btn-quiet" disabled={busy || loading} onClick={() => void refresh()}>사진 새로고침</button>
        {canManage && images.length > 0 && <button type="button" className="btn-secondary" disabled={busy || loading} aria-expanded={showManagement} aria-controls={`team-photo-management-${teamId}`} onClick={() => setManaging(!managing)}>{showManagement ? "관리 닫기" : "사진 관리"}</button>}
      </div>
    </div>
    {loading && <p className="mt-4 text-sm text-muted">사진을 불러오는 중입니다.</p>}
    {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm leading-6 text-danger"><Icon name="info" className="mt-1 size-4" />{error}</p>}
    {notice && <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm leading-6 text-success"><Icon name="check" className="mt-1 size-4" />{notice}</p>}
    {images.length > 0 && <TeamPhotoViewer key={images.map(image => image.id).join("-")} images={images} teamName={teamName} />}
    <div id={`team-photo-management-${teamId}`} hidden={!showManagement}>
    {showManagement && images.length > 0 && <div className="mt-5 grid gap-3 border-t border-line pt-5">
      <p className="text-xs leading-5 text-muted">첫 번째 사진이 대표 사진이에요. 순서를 바꿔 대표 사진을 선택할 수 있어요.</p>
      {images.map((image, index) => <figure key={image.id} className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-start gap-3 rounded-xl border border-line p-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-lg bg-subtle"><GalleryPhoto src={`${API_BASE_URL}${image.url}`} alt={`${index + 1}번 관리 사진`} className="h-16 w-full object-contain" /></div>
        <figcaption className="grid min-w-0 gap-1">
          <p className="break-all text-sm font-medium text-ink">{image.originalFileName}</p>
          <p className="text-xs text-muted">{index === 0 ? "대표 사진" : `${index + 1}번째 사진`}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-quiet" aria-label={`${index + 1}번 사진 앞으로`} disabled={busy || index === 0} onClick={() => move(index, -1)}>앞으로</button>
            <button type="button" className="btn-quiet" aria-label={`${index + 1}번 사진 뒤로`} disabled={busy || index === images.length - 1} onClick={() => move(index, 1)}>뒤로</button>
            <button type="button" className="btn-quiet text-danger" disabled={busy} onClick={() => setDeletingId(image.id)}>사진 삭제</button>
          </div>
          {deletingId === image.id && <div className="rounded-lg border border-danger-line bg-danger-soft p-3">
            <p className="text-sm text-danger">이 사진을 팀 홈에서 삭제할까요?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => setDeletingId(null)}>취소</button>
              <button type="button" className="btn-secondary border-danger-line text-danger" disabled={busy} onClick={() => void mutate(() => deleteTeamImage(teamId, image.id), "사진을 삭제했습니다.")}>삭제 확인</button>
            </div>
          </div>}
        </figcaption>
      </figure>)}
    </div>}
    {showManagement && <form className={`grid gap-4 ${images.length ? "mt-5 border-t border-line pt-5" : "mt-4"}`} aria-busy={busy} onSubmit={event => {
      event.preventDefault(); if (selected) void mutate(() => uploadTeamImage(teamId, selected), "사진을 등록했습니다.", true);
    }}>
      <input ref={input} type="file" accept=".jpg,image/jpeg" aria-label="팀 사진 선택" aria-describedby={`team-photo-help-${teamId}`} disabled={!canChoose} onChange={event => choose(event.target.files?.[0])} className="sr-only" tabIndex={-1} />
      {selected && preview ? <div className="overflow-hidden rounded-xl border border-brand-ring bg-white">
        <div className="grid gap-4 p-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center sm:gap-5 sm:p-5">
          <div className="overflow-hidden rounded-lg bg-subtle"><GalleryPhoto key={preview} src={preview} alt="선택한 팀 사진 미리보기" className="h-40 w-full object-contain" /></div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-ink"><Icon name={uploading ? "spinner" : "image"} className={`size-3.5 ${uploading ? "animate-spin" : ""}`} />{uploading ? "등록 중" : "등록 대기"}</span>
            <p className="mt-3 break-all text-sm font-semibold text-ink">{selected.name}</p>
            <p className="mt-1 text-xs text-muted">JPG · {selected.size < 1024 * 1024 ? `${Math.max(1, Math.round(selected.size / 1024))}KB` : `${(selected.size / (1024 * 1024)).toFixed(1)}MB`}</p>
            <p className="mt-3 text-xs leading-5 text-muted">{isFull ? "사진 3장이 모두 등록됐어요. 기존 사진을 먼저 삭제해 주세요." : "아래 등록 버튼을 누르면 팀 홈에 공개됩니다."}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-line bg-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap gap-1">
            <button type="button" className="btn-quiet disabled:cursor-not-allowed disabled:opacity-50" disabled={!canChoose} onClick={() => input.current?.click()}>다른 사진 선택</button>
            <button type="button" className="btn-quiet disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} onClick={clearSelection}>선택 취소</button>
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!canChoose}>
            <Icon name={uploading ? "spinner" : "upload"} className={`size-4 ${uploading ? "animate-spin" : ""}`} />{uploading ? "등록 중…" : "사진 등록"}
          </button>
        </div>
      </div> : isFull ? <div className="flex items-start gap-3 rounded-xl bg-subtle p-4 sm:p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand-ink"><Icon name="check" className="size-5" /></span>
        <div><p className="text-sm font-semibold text-ink">사진 3장이 모두 등록됐어요</p><p className="mt-1 text-sm leading-6 text-muted">새 사진을 올리려면 등록된 사진을 먼저 삭제해 주세요.</p></div>
      </div> : <div className={`flex flex-col items-center rounded-xl border border-dashed px-5 py-7 text-center transition-colors sm:py-9 ${dragging ? "border-brand bg-brand-soft ring-2 ring-brand-ring" : "border-line-strong bg-canvas"}`}
        onDragEnter={event => { event.preventDefault(); if (canChoose && event.dataTransfer.types.includes("Files")) { dragDepth.current += 1; setDragging(true); } }}
        onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = canChoose ? "copy" : "none"; }}
        onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
        onDrop={event => {
          event.preventDefault(); dragDepth.current = 0; setDragging(false);
          if (!canChoose) return;
          if (event.dataTransfer.files.length !== 1) { setError("사진은 한 장씩 선택해 주세요."); return; }
          choose(event.dataTransfer.files[0]);
        }}>
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-white text-brand-ink"><Icon name="image" className="size-6" /></span>
        <p className="mt-4 text-base font-semibold text-ink">{dragging ? "여기에 사진을 놓아주세요" : images.length ? "새로운 팀 사진을 추가해 보세요" : "팀을 소개할 사진을 올려보세요"}</p>
        <p className="mt-2 text-sm leading-6 text-muted"><span className="hidden sm:inline">사진을 끌어 놓거나 </span>아래 버튼을 눌러 선택해 주세요.</p>
        <button type="button" className="btn-primary mt-5 w-full sm:w-auto" aria-describedby={`team-photo-help-${teamId}`} disabled={!canChoose} onClick={() => input.current?.click()}><Icon name="plus" />사진 선택</button>
      </div>}
      <div id={`team-photo-help-${teamId}`} className="flex flex-col gap-1 text-xs leading-5 text-muted sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-4">
        <p>JPG만 · 한 장당 5MB 이하 · 최대 3장</p>
        <p>등록한 사진은 누구나 볼 수 있어요.</p>
      </div>
    </form>}
    </div>
  </section>;
}
