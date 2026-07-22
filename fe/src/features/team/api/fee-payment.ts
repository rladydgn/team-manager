import { getJson, putJson } from "@/shared/api/http";
import type { TeamMember } from "@/features/team/api/team";

export type FeePaymentStatus = "PAID" | "UNPAID" | "INJURED";

export type TeamFeePaymentMonth = {
  paymentMonth: number;
  status: FeePaymentStatus;
  memo: string | null;
};

export type TeamFeePaymentMember = {
  teamMemberId: number;
  name: string;
  role: TeamMember["role"];
  payments: TeamFeePaymentMonth[];
};

export type TeamFeePaymentsYear = {
  paymentYear: number;
  members: TeamFeePaymentMember[];
};

export type TeamFeePaymentUpdateRequest = {
  teamMemberId: number;
  paymentYear: number;
  paymentMonth: number;
  status: FeePaymentStatus;
  memo?: string;
};

export type TeamFeePayment = {
  teamMemberId: number;
  paymentYear: number;
  paymentMonth: number;
  status: FeePaymentStatus;
  memo: string | null;
};

export function getTeamFeePayments(teamId: number, paymentYear: number) {
  return getJson<TeamFeePaymentsYear>(
    `/teams/${teamId}/fee-payments?paymentYear=${paymentYear}`
  );
}

export function updateTeamFeePayment(
  teamId: number,
  request: TeamFeePaymentUpdateRequest
) {
  return putJson<TeamFeePayment, TeamFeePaymentUpdateRequest>(
    `/teams/${teamId}/fee-payments`,
    request
  );
}
