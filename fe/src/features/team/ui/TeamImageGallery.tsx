"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteTeamImage, getTeamImages, reorderTeamImages, uploadTeamImage, type TeamImage } from "../api/team-images";
import { API_BASE_URL } from "@/shared/config/api";

function GalleryPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="grid min-h-40 place-items-center gap-3 bg-subtle p-5 text-center text-sm text-muted">
    <p>이미지를 불러오지 못했습니다.</p><button type="button" className="btn-secondary" onClick={() => setFailed(false)}>다시 보기</button>
  </div>;
  return <Image src={src} alt={alt} width={1200} height={800} unoptimized className="h-auto w-full" onError={() => setFailed(true)} />;
}

export function TeamImageGallery({ teamId, teamName, canManage }: { teamId: number; teamName: string; canManage: boolean }) {
  const [images, setImages] = useState<TeamImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const previewRef = useRef("");

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
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await action();
      if (!response.data) throw new Error("이미지 목록을 받지 못했습니다. 새로고침 후 확인해 주세요.");
      setImages(response.data); setDeletingId(null); setNotice(message);
      if (uploaded) clearSelection();
    } catch (error) { setError(error instanceof Error ? error.message : "이미지를 저장하지 못했습니다."); }
    finally { setBusy(false); }
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
      <button type="button" className="btn-quiet" disabled={busy || loading} onClick={() => void refresh()}>사진 새로고침</button>
    </div>
    {loading && <p className="mt-4 text-sm text-muted">사진을 불러오는 중입니다.</p>}
    {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
    {notice && <p role="status" className="mt-4 text-sm text-brand-ink">{notice}</p>}
    {!loading && images.length === 0 && canManage && <p className="mt-4 text-sm text-muted">팀을 소개할 사진을 등록해 주세요.</p>}
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
      {images.map((image, index) => <figure key={image.id} className="min-w-0 overflow-hidden rounded-xl border border-line">
        <GalleryPhoto src={`${API_BASE_URL}${image.url}`} alt={`${teamName} 팀 사진 ${index + 1}`} />
        {canManage && <figcaption className="grid gap-3 p-3">
          <p className="break-all text-xs text-muted">{image.originalFileName}</p>
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
        </figcaption>}
      </figure>)}
    </div>
    {canManage && <form className="mt-5 grid gap-3 border-t border-line pt-5" onSubmit={event => {
      event.preventDefault(); if (selected) void mutate(() => uploadTeamImage(teamId, selected), "사진을 등록했습니다.", true);
    }}>
      <label className="grid gap-2 text-sm font-medium">팀 사진 선택
        <input ref={input} type="file" accept=".jpg,image/jpeg" disabled={busy || loading || images.length >= 3} onChange={event => choose(event.target.files?.[0])} className="min-w-0 max-w-full text-sm" />
      </label>
      <p className="text-xs leading-5 text-muted">JPG만, 한 장당 5MB 이하로 최대 3장까지 등록할 수 있습니다. 등록한 사진은 누구나 볼 수 있습니다.</p>
      {preview && <div className="max-w-sm overflow-hidden rounded-lg border border-line"><GalleryPhoto key={preview} src={preview} alt="선택한 팀 사진 미리보기" /></div>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={busy || loading || !selected || images.length >= 3}>{busy ? "처리 중…" : "사진 등록"}</button>
        {selected && <button type="button" className="btn-secondary" disabled={busy} onClick={clearSelection}>선택 취소</button>}
      </div>
    </form>}
  </section>;
}
