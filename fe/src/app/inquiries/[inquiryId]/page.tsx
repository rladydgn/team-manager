"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { getMyInquiry } from "@/features/inquiry/api/inquiry";
import { useInquiryQuery } from "@/features/inquiry/model/use-inquiry-query";
import { formatInquiryDate, inquiryButtonClass, inquiryCategories, InquiryStatusBadge } from "@/features/inquiry/ui/InquiryPresentation";

export default function InquiryDetailPage() {
  const params = useParams<{ inquiryId: string }>();
  const id = Number(params.inquiryId);
  if (!Number.isSafeInteger(id) || id <= 0) return <p role="alert">올바르지 않은 문의 주소입니다.</p>;
  return <InquiryDetail key={id} inquiryId={id} />;
}

function InquiryDetail({ inquiryId }: { inquiryId: number }) {
  const load = useCallback(() => getMyInquiry(inquiryId), [inquiryId]);
  const { data, error, retry } = useInquiryQuery(load);
  if (error) return <section className="rounded-xl border border-[#dbe4f0] bg-white p-6"><h1 className="text-xl font-bold">문의를 불러올 수 없습니다</h1><p role="alert" className="mt-3 text-sm text-[#b91c1c]">{error}</p><button type="button" onClick={retry} className={`${inquiryButtonClass} mt-4`}>다시 불러오기</button></section>;
  if (!data) return <p role="status" className="py-16 text-center text-sm text-[#64748b]">문의를 불러오는 중입니다.</p>;

  return (
    <article className="overflow-hidden rounded-xl border border-[#dbe4f0] bg-white">
      <header className="border-b border-[#e2e8f0] bg-[#fbfcfe] p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm font-semibold text-[#64748b]">{inquiryCategories[data.category]}</span><InquiryStatusBadge status={data.status} /></div>
        <h1 className="mt-4 text-2xl font-bold leading-9 text-[#0f172a] [overflow-wrap:anywhere]">{data.title}</h1>
        <p className="mt-3 text-sm text-[#64748b]">등록일 {formatInquiryDate(data.createdAt)}</p>
      </header>
      <div className="p-5 sm:p-7">
        <h2 className="text-sm font-semibold text-[#64748b]">문의 내용</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-[#334155] [overflow-wrap:anywhere]">{data.content}</p>
        <Link href="/inquiries" className={`${inquiryButtonClass} mt-8`}>내 문의 목록으로</Link>
      </div>
    </article>
  );
}
