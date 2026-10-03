"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { TeamLogo } from "@/features/team/ui/TeamLogo";

export function TeamLogoField({ file, existingLogoUrl, name, disabled = false, onChange, onBusyChange, onRemove }: {
  file: File | null;
  existingLogoUrl?: string | null;
  name: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
  onBusyChange: (busy: boolean) => void;
  onRemove?: () => void;
}) {
  const id = useId();
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const [error, setError] = useState("");
  const selectionVersion = useRef(0);
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview({ file, url: String(reader.result) });
    reader.readAsDataURL(file);
    return () => { reader.onload = null; reader.abort(); };
  }, [file]);
  useEffect(() => () => { selectionVersion.current += 1; }, []);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    const version = ++selectionVersion.current;
    setError("");
    onBusyChange(true);
    try {
      if (!["image/png", "image/jpeg"].includes(selected.type)) throw new Error("PNG 또는 JPG 이미지를 선택해 주세요.");
      if (selected.size > 1024 * 1024) throw new Error("1MB 이하의 이미지를 선택해 주세요.");
      const image = await createImageBitmap(selected);
      const { width, height } = image;
      image.close();
      if (width < 64 || height < 64 || width > 2048 || height > 2048) {
        throw new Error("가로·세로 각각 64~2,048px인 이미지를 선택해 주세요.");
      }
      if (version === selectionVersion.current) onChange(selected);
    } catch (error) {
      if (version === selectionVersion.current) setError(error instanceof Error && error.name !== "InvalidStateError" ? error.message : "이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.");
    } finally {
      if (version === selectionVersion.current) onBusyChange(false);
    }
  }

  return (
    <fieldset className="min-w-0 space-y-3" disabled={disabled}>
      <legend className="text-sm font-semibold">팀 로고 <span className="font-normal text-muted">· 선택</span></legend>
      <div className="flex flex-wrap items-start gap-4">
        <TeamLogo logoUrl={preview?.file === file ? preview?.url : existingLogoUrl} name={name || "팀"} className="size-20 text-xl" />
        <div className="min-w-0 flex-1 basis-52 space-y-2">
          <label htmlFor={id} className="block text-sm font-medium text-secondary">로고 이미지 선택</label>
          <input id={id} type="file" accept="image/png,image/jpeg" onChange={(event) => void selectFile(event)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} aria-invalid={Boolean(error)} className="block w-full min-w-0 text-sm text-muted file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-line-strong file:bg-white file:px-3 file:font-medium file:text-secondary disabled:opacity-50" />
          <p id={`${id}-help`} className="text-xs leading-5 text-muted">256×256px 권장 · PNG, JPG · 최대 1MB<br />가로·세로 64~2,048px. 비율을 유지하고 여백을 두어 256×256px로 저장합니다.</p>
          {file ? <p className="break-all text-xs text-secondary">선택한 파일: {file.name}</p> : null}
          {file || existingLogoUrl ? <button type="button" className="btn-quiet text-danger" onClick={() => { selectionVersion.current += 1; onBusyChange(false); onChange(null); onRemove?.(); setError(""); }}>로고 제거</button> : null}
          {error ? <p id={`${id}-error`} role="alert" className="text-sm text-danger">{error}</p> : null}
        </div>
      </div>
    </fieldset>
  );
}
