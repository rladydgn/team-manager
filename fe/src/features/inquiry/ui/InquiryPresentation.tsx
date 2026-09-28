import type { InquiryCategory, InquiryStatus } from "@/features/inquiry/api/inquiry";

export const inquiryCategories: Record<InquiryCategory, string> = {
  USAGE: "사용 문의",
  BUG: "오류 제보",
  SUGGESTION: "기능 제안",
  OTHER: "기타",
};

export const inquiryButtonClass = "btn-secondary";

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${status === "ANSWERED" ? "border-success-line bg-success-soft text-success" : "border-line-strong bg-brand-soft text-brand-ink"}`}>
      {status === "ANSWERED" ? "답변 완료" : "답변 대기"}
    </span>
  );
}

export function formatInquiryDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
