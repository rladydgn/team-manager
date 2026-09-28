"use client";

import { PageHeading } from "@/shared/ui/PageHeading";
import Link from "next/link";
import { useCallback, useState } from "react";
import { getMyInquiries } from "@/features/inquiry/api/inquiry";
import { useInquiryQuery } from "@/features/inquiry/model/use-inquiry-query";
import { formatInquiryDate, inquiryButtonClass, inquiryCategories, InquiryStatusBadge } from "@/features/inquiry/ui/InquiryPresentation";

export default function MyInquiriesPage() {
  const [page, setPage] = useState(0);
  return (
    <>
      <PageHeading title="내 문의" description="작성한 문의와 답변 상태를 확인하세요." action={<Link href="/inquiries/new" className="btn-primary">문의하기</Link>} />
      <InquiryList key={page} page={page} onPageChange={setPage} />
    </>
  );
}

function InquiryList({ page, onPageChange }: { page: number; onPageChange: (page: number) => void }) {
  const load = useCallback(() => getMyInquiries(page), [page]);
  const { data, error, retry } = useInquiryQuery(load);

  if (error) return <div className="mt-6 rounded-xl border border-line bg-white p-6"><p role="alert" className="text-sm text-danger">{error}</p><button type="button" onClick={retry} className={`${inquiryButtonClass} mt-4`}>다시 시도</button></div>;
  if (!data) return <p role="status" className="py-16 text-center text-sm text-muted">내 문의를 불러오는 중입니다.</p>;

  return (
    <>
      {data.inquiries.length === 0 ? (
        <section className="mt-6 rounded-xl border border-dashed border-line-strong bg-white px-5 py-12 text-center">
          <h2 className="text-lg font-semibold">{page === 0 ? "아직 작성한 문의가 없습니다" : "이 페이지에 문의가 없습니다"}</h2>
          <p className="mt-3 text-sm leading-7 text-muted">서비스 이용 중 궁금한 점이 있다면 문의를 남겨 주세요.</p>
          <Link href="/inquiries/new" className={`${inquiryButtonClass} mt-5`}>문의하기</Link>
        </section>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {data.inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link href={`/inquiries/${inquiry.id}`} className="block px-5 py-5 transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted">{inquiryCategories[inquiry.category]}</span>
                  <InquiryStatusBadge status={inquiry.status} />
                </div>
                <h2 className="mt-2 font-semibold text-ink [overflow-wrap:anywhere]">{inquiry.title}</h2>
                <p className="mt-2 text-xs leading-6 text-muted">등록일 {formatInquiryDate(inquiry.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {page > 0 || data.hasNext ? (
        <nav aria-label="문의 목록 페이지" className="mt-5 flex items-center justify-center gap-4">
          <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)} className={inquiryButtonClass}>이전</button>
          <span aria-live="polite" className="text-sm text-muted">{page + 1}페이지</span>
          <button type="button" disabled={!data.hasNext} onClick={() => onPageChange(page + 1)} className={inquiryButtonClass}>다음</button>
        </nav>
      ) : null}
    </>
  );
}
