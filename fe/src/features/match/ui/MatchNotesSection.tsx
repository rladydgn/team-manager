"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  getMatchNotes,
  updateMatchNote,
  type MatchNotes,
  type MatchNoteVisibility,
} from "@/features/match/api/match";
import { MATCH_NOTE_MAX_LENGTH, splitMatchNote } from "@/features/match/model/notes";
import { ApiRequestError } from "@/shared/api/http";

const buttonClass = "inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50";

export function MatchNotesSection({ matchId }: { matchId: number }) {
  const [notes, setNotes] = useState<MatchNotes | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await getMatchNotes(matchId);
        if (!response.data) throw new Error("매치 내용 기록을 받지 못했습니다.");
        if (active) setNotes(response.data);
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : "기록을 불러오지 못했습니다.");
      }
    }
    void load();
    return () => { active = false; };
  }, [matchId, attempt]);

  function handleAccessDenied() {
    setNotes(null);
    setError("기록 접근 권한이 변경되었습니다. 다시 불러와 주세요.");
  }

  return (
    <section aria-labelledby="match-notes-title" className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-line bg-canvas px-5 py-5 sm:px-6">
        <h2 id="match-notes-title" className="text-lg font-semibold text-ink">매치 내용 기록</h2>
        <p className="mt-1 text-sm leading-6 text-muted">경기 영상, 특이사항과 함께 기억할 내용을 확인하세요.</p>
      </div>
      {error ? (
        <div className="px-5 py-6 sm:px-6">
          <p role="alert" className="text-sm text-danger">{error}</p>
          <button type="button" className={`${buttonClass} mt-3`} onClick={() => { setError(""); setAttempt((value) => value + 1); }}>다시 불러오기</button>
        </div>
      ) : notes ? (
        <div className="divide-y divide-line">
          <MatchNoteCard
            matchId={matchId}
            visibility="PUBLIC"
            content={notes.publicNote}
            canManage={notes.canManage}
            onSaved={(content) => setNotes((current) => current ? { ...current, publicNote: content } : current)}
            onAccessDenied={handleAccessDenied}
          />
          {notes.canManage && notes.managerNote != null ? (
            <MatchNoteCard
              matchId={matchId}
              visibility="MANAGERS"
              content={notes.managerNote}
              canManage={notes.canManage}
              onSaved={(content) => setNotes((current) => current ? { ...current, managerNote: content } : current)}
              onAccessDenied={handleAccessDenied}
            />
          ) : null}
        </div>
      ) : <p role="status" className="px-5 py-6 text-sm text-muted sm:px-6">기록을 불러오는 중입니다.</p>}
    </section>
  );
}

function MatchNoteCard({ matchId, visibility, content, canManage, onSaved, onAccessDenied }: {
  matchId: number;
  visibility: MatchNoteVisibility;
  content: string;
  canManage: boolean;
  onSaved: (content: string) => void;
  onAccessDenied: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isPrivate = visibility === "MANAGERS";
  const title = isPrivate ? "운영진 전용 기록" : "공개 기록";
  const inputId = `match-note-${visibility}`;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await updateMatchNote(matchId, visibility, draft);
      if (!response.data) throw new Error("저장된 기록을 받지 못했습니다.");
      onSaved(isPrivate ? response.data.managerNote ?? "" : response.data.publicNote);
      setIsEditing(false);
      setNotice(`${title}을 저장했습니다.`);
    } catch (error) {
      if (error instanceof ApiRequestError && [401, 403].includes(error.status)) {
        onAccessDenied();
        return;
      }
      setError(error instanceof Error ? error.message : "기록을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className={`min-w-0 px-5 py-5 sm:px-6 ${isPrivate ? "bg-subtle" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-ink">{title}</h3>
            <span className="rounded border border-line-strong px-2 py-0.5 text-xs font-semibold text-secondary">{isPrivate ? "운영진만" : "팀원 전체 공개"}</span>
          </div>
          <p id={`${inputId}-help`} className="mt-2 text-sm leading-6 text-muted">
            {isPrivate ? "운영진만 조회하고 수정할 수 있습니다." : "이 매치를 볼 수 있는 모든 팀원에게 공개됩니다."}
          </p>
        </div>
        {canManage && !isEditing ? (
          <button type="button" aria-label={`${title} ${content ? "수정" : "작성"}`} className={buttonClass} onClick={() => { setDraft(content); setError(""); setNotice(""); setIsEditing(true); }}>{content ? "수정" : "기록 작성"}</button>
        ) : null}
      </div>
      {isEditing ? (
        <form onSubmit={(event) => void save(event)} className="mt-4">
          <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-secondary">{title} 내용</label>
          <textarea
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MATCH_NOTE_MAX_LENGTH}
            disabled={isSaving}
            aria-describedby={`${inputId}-help ${inputId}-hint`}
            rows={7}
            placeholder={isPrivate ? "운영진이 확인할 특이사항, 후속 조치, 비공개 영상 링크 등을 남겨 주세요." : "유튜브 영상 링크, 경기 중 특이사항, 팀원에게 공유할 내용을 남겨 주세요."}
            className="block w-full min-w-0 resize-y rounded-xl border border-line-strong bg-white px-3 py-3 text-base leading-7 text-ink outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60 sm:text-sm"
          />
          <div id={`${inputId}-hint`} className="mt-2 flex flex-wrap justify-between gap-2 text-xs leading-5 text-muted">
            <p>https://로 시작하는 영상·웹 링크는 저장 후 클릭할 수 있습니다. 내용을 비우고 저장하면 삭제됩니다.</p>
            <span className="shrink-0">{draft.length.toLocaleString()} / 10,000자</span>
          </div>
          {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" disabled={isSaving} className={buttonClass} onClick={() => { setIsEditing(false); setError(""); }}>취소</button>
            <button type="submit" disabled={isSaving || draft === content} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "저장 중…" : `${title} 저장`}</button>
          </div>
        </form>
      ) : content ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-secondary [overflow-wrap:anywhere]">
          {splitMatchNote(content).map((part, index) => part.href ? (
            <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className="text-brand-ink underline decoration-[#9eb3d0] underline-offset-4 hover:text-brand-hover">{part.text}</a>
          ) : <span key={index}>{part.text}</span>)}
        </p>
      ) : <p className="mt-4 text-sm leading-6 text-placeholder">{canManage ? "아직 기록이 없습니다. 영상 링크나 특이사항을 남겨 보세요." : "아직 공유된 기록이 없습니다."}</p>}
      {notice ? <p role="status" className="mt-3 text-sm text-brand-ink">{notice}</p> : null}
    </article>
  );
}
