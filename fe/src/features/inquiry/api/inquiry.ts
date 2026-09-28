import { getJson, postJson } from "@/shared/api/http";

export type InquiryCategory = "USAGE" | "BUG" | "SUGGESTION" | "OTHER";
export type InquiryStatus = "WAITING" | "ANSWERED";
export type InquirySummary = {
  id: number;
  category: InquiryCategory;
  title: string;
  status: InquiryStatus;
  createdAt: string;
};
export type Inquiry = InquirySummary & { content: string };
export type InquiryList = { inquiries: InquirySummary[]; page: number; pageSize: number; hasNext: boolean };
export type InquiryCreateRequest = { category: InquiryCategory; title: string; content: string };

export function createInquiry(request: InquiryCreateRequest) {
  return postJson<Inquiry, InquiryCreateRequest>("/inquiries", request);
}

export function getMyInquiries(page: number) {
  return getJson<InquiryList>(`/inquiries?page=${page}`);
}

export function getMyInquiry(id: number) {
  return getJson<Inquiry>(`/inquiries/${id}`);
}
