"use client";

import { useEffect, useState } from "react";
import { getParticipationHistory, updateProxyParticipation, type Match, type MatchParticipant, type ParticipationHistory } from "@/features/match/api/match";
import { canProxyUpdateParticipation } from "@/features/match/model/participation";
import type { TeamMember } from "@/features/team/api/team";

const statusLabels = { AVAILABLE: "참여", UNAVAILABLE: "불참", PENDING: "미응답", INVITED: "초대됨" };

export function ProxyParticipationPanel({ match, members, participants, onUpdated }: {
  match: Match;
  members: TeamMember[];
  participants: MatchParticipant[];
  onUpdated: (participant: MatchParticipant) => void;
}) {
  const [targetId, setTargetId] = useState(0);
  const [voteStatus, setVoteStatus] = useState<"AVAILABLE" | "UNAVAILABLE">("AVAILABLE");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [history, setHistory] = useState<ParticipationHistory[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyAttempt, setHistoryAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const targets = [...members.filter(member => member.status === "ACTIVE"), ...participants
    .filter(player => !members.some(member => member.id === player.teamMemberId && member.status === "ACTIVE"))
    .map(player => ({ id: player.teamMemberId, name: player.name, status: "LEFT" }))]
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ko") || a.id - b.id);
  const target = targets.find(member => member.id === targetId);
  const canEdit = canProxyUpdateParticipation(match, now) && target?.status === "ACTIVE";
  const afterDeadline = now >= new Date(match.participationDeadlineAt).getTime();

  useEffect(() => {
    if (!targetId) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setHistoryLoading(true);
      setHistoryError("");
      try {
        const result = await getParticipationHistory(match.id, targetId);
        if (!result.data) throw new Error("변경 이력을 받지 못했습니다.");
        if (active) setHistory(result.data);
      } catch (failure) {
        if (active) setHistoryError(failure instanceof Error ? failure.message : "변경 이력을 불러오지 못했습니다.");
      } finally {
        if (active) setHistoryLoading(false);
      }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [match.id, targetId, historyAttempt]);

  async function save() {
    if (!canEdit || isSaving) return;
    if (Date.now() >= new Date(match.participationDeadlineAt).getTime() && !reason.trim()) {
      setError("마감 후에는 정정 사유를 입력해 주세요.");
      return;
    }
    if (voteStatus === "UNAVAILABLE" && !window.confirm("불참으로 변경하면 기존 포메이션 배치가 제외 상태로 표시됩니다. 변경할까요?")) return;
    setIsSaving(true); setError(""); setNotice("");
    try {
      const result = await updateProxyParticipation(match.id, targetId, voteStatus, reason.trim());
      if (!result.data) throw new Error("변경된 참석 상태를 받지 못했습니다.");
      onUpdated(result.data);
      setNotice(`${target?.name ?? "선수"}의 참석 응답을 변경했습니다.`);
      setReason("");
      setHistoryAttempt(current => current + 1);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "참석 응답을 변경하지 못했습니다.");
    } finally { setIsSaving(false); }
  }

  return (
    <div className="border-b border-line bg-canvas px-5 py-5 sm:px-6">
      <h3 className="font-semibold text-ink">운영진 대리 참석</h3>
      <p className="mt-2 text-sm leading-6 text-muted">활성 팀원의 참석·불참 응답을 대신 등록합니다. 실제 출석과 개인 기록은 바뀌지 않습니다. 투표 마감 후에는 사유를 남겨 경기 시작 전까지 변경할 수 있습니다.</p>
      {match.matchType === "INTERNAL" ? <p className="mt-1 text-sm leading-6 text-muted">새 참가자는 먼저 편을 배정해야 해당 편의 포메이션 후보에 표시됩니다.</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-2 text-sm font-medium text-secondary">대상 선수
          <select className="field w-full min-w-0" value={targetId} disabled={isSaving} onChange={event => {
            const nextId = Number(event.target.value);
            setTargetId(nextId);
            const currentVote = participants.find(player => player.teamMemberId === nextId)?.voteStatus;
            setVoteStatus(currentVote === "UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE");
            setReason(""); setError(""); setNotice(""); setHistory([]); setHistoryError(""); setHistoryLoading(nextId > 0);
          }}>
            <option value={0}>선수를 선택하세요</option>
            {targets.map(member => <option key={member.id} value={member.id}>{member.name ?? "이름 없는 선수"}{member.status !== "ACTIVE" ? " (과거 참가자·이력 조회만)" : ""}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-medium text-secondary">참석 응답
          <select className="field w-full" value={voteStatus} disabled={!canEdit || isSaving} onChange={event => setVoteStatus(event.target.value as typeof voteStatus)}>
            <option value="AVAILABLE">참여</option><option value="UNAVAILABLE">불참</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-secondary sm:col-span-2">정정 사유 {afterDeadline ? "(필수)" : "(선택)"}
          <textarea className="field min-h-24 w-full" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} disabled={!canEdit || isSaving} />
          <span className="text-xs font-normal text-muted">본인 메모는 유지하며, 정정 사유는 운영진용 이력에만 남깁니다. 최대 500자.</span>
        </label>
      </div>
      {!canProxyUpdateParticipation(match, now) ? <p className="mt-3 text-sm text-muted">경기가 시작됐거나 기록이 저장·취소된 경기는 대리 변경할 수 없습니다. 기존 이력은 조회할 수 있습니다.</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
      {notice ? <p role="status" className="mt-3 text-sm text-brand-ink">{notice}</p> : null}
      <button type="button" className="btn-primary mt-4" disabled={!canEdit || isSaving || (afterDeadline && !reason.trim())} onClick={() => void save()}>{isSaving ? "저장 중…" : "대리 응답 저장"}</button>
      {targetId > 0 ? <div className="mt-5 border-t border-line pt-4">
        <h4 className="text-sm font-semibold text-ink">참석 응답 변경 이력 · 운영진 전용</h4>
        {historyLoading ? <p className="mt-2 text-sm text-muted">이력을 불러오는 중입니다.</p> : historyError ? <div className="mt-2 text-sm text-danger"><p>{historyError}</p><button type="button" className="btn-secondary mt-2" onClick={() => setHistoryAttempt(current => current + 1)}>이력 다시 시도</button></div> : history.length === 0 ? <p className="mt-2 text-sm text-muted">저장된 변경 이력이 없습니다. 기존 응답의 출처는 추정하지 않습니다.</p> : <ul className="mt-2 divide-y divide-line">
          {history.map(item => <li key={item.id} className="py-3 text-sm leading-6 text-secondary">
            <p className="break-words font-medium">{item.actorName} · {item.source === "SELF" ? "본인 응답" : "대리 등록"} · {item.previousStatus ? statusLabels[item.previousStatus] : "명단 없음"} → {statusLabels[item.voteStatus]}</p>
            <p className="text-xs text-muted">{new Date(item.changedAt).toLocaleString("ko-KR")}</p>
            {item.reason ? <p className="mt-1 whitespace-pre-wrap break-words">사유: {item.reason}</p> : null}
          </li>)}
        </ul>}
      </div> : null}
    </div>
  );
}
