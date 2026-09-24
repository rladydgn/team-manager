import type { InquiryCategory, InquiryStatus } from "@/features/inquiry/api/inquiry";

export const inquiryCategories: Record<InquiryCategory, string> = {
  USAGE: "사용 문의",
  BUG: "오류 제보",
  SUGGESTION: "기능 제안",
  OTHER: "기타",
};

export const inquiryButtonClass = "inline-flex min-h-11 items-center justify-center rounded-md border border-[#c8d4e6] bg-white px-4 py-2 text-sm font-semibold text-[#3d5b86] transition-colors hover:bg-[#f0f4fa] disabled:cursor-not-allowed disabled:opacity-50";

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={`inline-flex shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold ${status === "ANSWERED" ? "border-[#b8d7c1] bg-[#f1f8f2] text-[#36734a]" : "border-[#c8d4e6] bg-[#edf3fa] text-[#3d5b86]"}`}>
      {status === "ANSWERED" ? "답변 완료" : "답변 대기"}
    </span>
  );
}

export function formatInquiryDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}
