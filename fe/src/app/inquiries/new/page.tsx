"use client";

import { PageHeading } from "@/shared/ui/PageHeading";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createInquiry, type InquiryCategory } from "@/features/inquiry/api/inquiry";
import { inquiryButtonClass, inquiryCategories } from "@/features/inquiry/ui/InquiryPresentation";

const inputClass = "w-full min-w-0 rounded-lg border border-line-strong bg-white px-3 py-2.5 text-base font-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:bg-subtle";

export default function NewInquiryPage() {
  const router = useRouter();
  const [category, setCategory] = useState<InquiryCategory | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (!category || !title.trim() || !content.trim()) {
      setError("문의 유형을 선택하고 제목과 내용을 입력해 주세요.");
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await createInquiry({ category, title, content });
      if (!response.data) throw new Error("등록된 문의 정보를 받지 못했습니다.");
      if (active.current) router.replace(`/inquiries/${response.data.id}`);
    } catch (error) {
      if (active.current) {
        setError(error instanceof Error ? error.message : "문의를 등록하지 못했습니다. 다시 시도해 주세요.");
        submitting.current = false;
        setIsSubmitting(false);
      }
    }
  }

  return (
    <>
      <PageHeading title="문의하기" description="궁금한 점이나 개선할 점을 알려주세요. 문의는 서비스 운영자에게 비공개로 전달됩니다." />
      <form onSubmit={(event) => void submit(event)} className="mt-6 grid gap-5 rounded-xl border border-line bg-white p-5 sm:p-7">
        <label className="grid gap-2 text-sm font-semibold text-secondary">
          문의 유형
          <select required value={category} onChange={(event) => setCategory(event.target.value as InquiryCategory | "")} disabled={isSubmitting} className={inputClass}>
            <option value="" disabled>문의 유형 선택</option>
            {Object.entries(inquiryCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-secondary">
          제목
          <input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} disabled={isSubmitting} placeholder="문의 내용을 간단히 요약해 주세요" aria-describedby="inquiry-title-length" className={inputClass} />
          <span id="inquiry-title-length" className="text-right text-xs font-normal text-muted">{title.length} / 100자</span>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-secondary">
          내용
          <textarea required rows={10} maxLength={10_000} value={content} onChange={(event) => setContent(event.target.value)} disabled={isSubmitting} aria-describedby="inquiry-content-help inquiry-content-length" placeholder={category === "BUG" ? "어느 화면에서 어떤 작업을 했는지, 기대한 결과와 실제 발생한 현상을 알려 주세요." : "궁금한 점이나 제안하고 싶은 내용을 자세히 남겨 주세요."} className={`${inputClass} resize-y leading-7`} />
          <span id="inquiry-content-length" className="text-right text-xs font-normal text-muted">{content.length.toLocaleString()} / 10,000자</span>
        </label>
        <p id="inquiry-content-help" className="text-sm leading-6 text-muted">등록한 내용과 처리 상태는 ‘내 문의’에서 확인할 수 있습니다.</p>
        {error ? <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/inquiries" className={inquiryButtonClass}>내 문의</Link>
          <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "등록 중…" : "문의 보내기"}</button>
        </div>
      </form>
    </>
  );
}
