"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { getMyInquiries } from "@/features/inquiry/api/inquiry";
import { useInquiryQuery } from "@/features/inquiry/model/use-inquiry-query";
import { formatInquiryDate, inquiryButtonClass, inquiryCategories, InquiryStatusBadge } from "@/features/inquiry/ui/InquiryPresentation";

export default function MyInquiriesPage() {
  const [page, setPage] = useState(0);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#0f172a]">내 문의</h1>
        <Link href="/inquiries/new" className={inquiryButtonClass}>새 문의 작성</Link>
      </div>
      <p className="mt-3 text-sm leading-7 text-[#64748b]">내가 작성한 비공개 문의와 처리 상태를 최신순으로 확인할 수 있습니다.</p>
      <InquiryList key={page} page={page} onPageChange={setPage} />
    </>
  );
}

function InquiryList({ page, onPageChange }: { page: number; onPageChange: (page: number) => void }) {
  const load = useCallback(() => getMyInquiries(page), [page]);
  const { data, error, retry } = useInquiryQuery(load);

  if (error) return <div className="mt-6 rounded-xl border border-[#dbe4f0] bg-white p-6"><p role="alert" className="text-sm text-[#b91c1c]">{error}</p><button type="button" onClick={retry} className={`${inquiryButtonClass} mt-4`}>다시 불러오기</button></div>;
  if (!data) return <p role="status" className="py-16 text-center text-sm text-[#64748b]">내 문의를 불러오는 중입니다.</p>;

  return (
    <>
      {data.inquiries.length === 0 ? (
        <section className="mt-6 rounded-xl border border-dashed border-[#c8d4e6] bg-white px-5 py-12 text-center">
          <h2 className="text-lg font-bold">{page === 0 ? "아직 작성한 문의가 없습니다" : "이 페이지에 문의가 없습니다"}</h2>
          <p className="mt-3 text-sm leading-7 text-[#64748b]">서비스 이용 중 궁금한 점이 있다면 문의를 남겨 주세요.</p>
          <Link href="/inquiries/new" className={`${inquiryButtonClass} mt-5`}>문의하기</Link>
        </section>
      ) : (
        <ul className="mt-6 divide-y divide-[#e2e8f0] overflow-hidden rounded-xl border border-[#dbe4f0] bg-white">
          {data.inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link href={`/inquiries/${inquiry.id}`} className="block px-5 py-5 transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4f6f9f] sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#64748b]">{inquiryCategories[inquiry.category]}</span>
                  <InquiryStatusBadge status={inquiry.status} />
                </div>
                <h2 className="mt-2 font-semibold text-[#1f2937] [overflow-wrap:anywhere]">{inquiry.title}</h2>
                <p className="mt-2 text-xs leading-6 text-[#64748b]">등록일 {formatInquiryDate(inquiry.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {page > 0 || data.hasNext ? (
        <nav aria-label="문의 목록 페이지" className="mt-5 flex items-center justify-center gap-4">
          <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)} className={inquiryButtonClass}>이전</button>
          <span aria-live="polite" className="text-sm text-[#64748b]">{page + 1}페이지</span>
          <button type="button" disabled={!data.hasNext} onClick={() => onPageChange(page + 1)} className={inquiryButtonClass}>다음</button>
        </nav>
      ) : null}
    </>
  );
}
