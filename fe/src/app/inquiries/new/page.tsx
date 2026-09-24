"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createInquiry, type InquiryCategory } from "@/features/inquiry/api/inquiry";
import { inquiryButtonClass, inquiryCategories } from "@/features/inquiry/ui/InquiryPresentation";

const inputClass = "w-full min-w-0 rounded-md border border-[#c8d4e6] bg-white px-3 py-2.5 text-base font-normal text-[#1f2937] outline-none focus:border-[#4f6f9f] focus:ring-2 focus:ring-[#e3eaf5] disabled:bg-[#f8fafc]";

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
      setError("카테고리를 선택하고 제목과 내용을 입력해 주세요.");
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
      <h1 className="text-3xl font-bold text-[#0f172a]">문의하기</h1>
      <p className="mt-3 text-sm leading-7 text-[#64748b]">서비스 이용 중 궁금한 점이나 오류를 알려 주세요. 팀과 관계없이 서비스 운영자에게 전달되며, 내 문의는 작성자만 조회할 수 있습니다.</p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 grid gap-5 rounded-xl border border-[#dbe4f0] bg-white p-5 sm:p-7">
        <label className="grid gap-2 text-sm font-semibold text-[#475569]">
          카테고리
          <select required value={category} onChange={(event) => setCategory(event.target.value as InquiryCategory | "")} disabled={isSubmitting} className={inputClass}>
            <option value="" disabled>문의 분야를 선택해 주세요</option>
            {Object.entries(inquiryCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#475569]">
          제목
          <input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} disabled={isSubmitting} placeholder="문의 내용을 간단히 요약해 주세요" aria-describedby="inquiry-title-length" className={inputClass} />
          <span id="inquiry-title-length" className="text-right text-xs font-normal text-[#64748b]">{title.length} / 100자</span>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-[#475569]">
          내용
          <textarea required rows={10} maxLength={10_000} value={content} onChange={(event) => setContent(event.target.value)} disabled={isSubmitting} aria-describedby="inquiry-content-help inquiry-content-length" placeholder={category === "BUG" ? "어느 화면에서 어떤 작업을 했는지, 기대한 결과와 실제 발생한 현상을 알려 주세요." : "궁금한 점이나 제안하고 싶은 내용을 자세히 남겨 주세요."} className={`${inputClass} resize-y leading-7`} />
          <span id="inquiry-content-length" className="text-right text-xs font-normal text-[#64748b]">{content.length.toLocaleString()} / 10,000자</span>
        </label>
        <p id="inquiry-content-help" className="text-sm leading-6 text-[#64748b]">등록한 내용과 처리 상태는 ‘내 문의’에서 확인할 수 있습니다.</p>
        {error ? <p role="alert" className="rounded-md bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/inquiries" className={inquiryButtonClass}>내 문의 목록</Link>
          <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#4f6f9f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#435f88] disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "등록 중…" : "문의 등록"}</button>
        </div>
      </form>
    </>
  );
}
