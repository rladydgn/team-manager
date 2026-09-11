import { getJson } from "@/shared/api/http";

export type TeamAttendanceMemberStatistic = {
  teamMemberId: number;
  name: string;
  attendanceCount: number;
  eligibleMatchCount: number;
  attendanceRate: number;
  trainingAttendanceCount: number;
  trainingEligibleMatchCount: number;
  trainingAttendanceRate: number;
  postVoteAbsenceCount: number;
  lateCount: number;
  goalCount: number;
  assistCount: number;
  cleanSheetCount: number;
};

export type TeamAttendanceStatistics = {
  startDate: string;
  endDate: string;
  totalMatchCount: number;
  totalTrainingCount: number;
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  members: TeamAttendanceMemberStatistic[];
};

export type TeamAttendanceSortBy =
  | "NAME"
  | "ATTENDANCE_RATE"
  | "TRAINING_ATTENDANCE_RATE"
  | "POST_VOTE_ABSENCE_COUNT"
  | "LATE_COUNT"
  | "GOAL_COUNT"
  | "ASSIST_COUNT"
  | "CLEAN_SHEET_COUNT";

export type SortDirection = "ASC" | "DESC";

export type TeamPlayerRankingEntry = {
  rank: number;
  teamMemberId: number;
  name: string;
  value: number;
  isCurrentUser: boolean;
};

export type TeamPlayerRankings = {
  startDate: string;
  endDate: string;
  completedMatchCount: number;
  goalRankings: TeamPlayerRankingEntry[];
  assistRankings: TeamPlayerRankingEntry[];
  cleanSheetRankings: TeamPlayerRankingEntry[];
};

export function getTeamAttendanceStatistics(
  teamId: number,
  startDate: string,
  endDate: string,
  page: number,
  sortBy: TeamAttendanceSortBy = "NAME",
  sortDirection: SortDirection = "ASC"
) {
  const searchParams = new URLSearchParams({
    startDate,
    endDate,
    page: String(page),
    sortBy,
    sortDirection,
  });

  return getJson<TeamAttendanceStatistics>(
    `/teams/${teamId}/statistics/attendance?${searchParams.toString()}`
  );
}

export function getTeamPlayerRankings(
  teamId: number,
  startDate: string,
  endDate: string
) {
  const searchParams = new URLSearchParams({ startDate, endDate });
  return getJson<TeamPlayerRankings>(
    `/teams/${teamId}/statistics/rankings?${searchParams.toString()}`
  );
}
