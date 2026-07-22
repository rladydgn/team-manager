import { getJson } from "@/shared/api/http";

export type TeamAttendanceMemberStatistic = {
  teamMemberId: number;
  name: string;
  attendanceCount: number;
  attendanceRate: number;
};

export type TeamAttendanceStatistics = {
  startDate: string;
  endDate: string;
  totalMatchCount: number;
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  members: TeamAttendanceMemberStatistic[];
};

export function getTeamAttendanceStatistics(
  teamId: number,
  startDate: string,
  endDate: string,
  page: number
) {
  const searchParams = new URLSearchParams({
    startDate,
    endDate,
    page: String(page),
  });

  return getJson<TeamAttendanceStatistics>(
    `/teams/${teamId}/statistics/attendance?${searchParams.toString()}`
  );
}
