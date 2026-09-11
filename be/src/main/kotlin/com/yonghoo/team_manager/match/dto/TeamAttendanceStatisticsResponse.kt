package com.yonghoo.team_manager.match.dto

import java.time.LocalDate

enum class TeamAttendanceSortBy {
    NAME,
    ATTENDANCE_RATE,
    TRAINING_ATTENDANCE_RATE,
    POST_VOTE_ABSENCE_COUNT,
    LATE_COUNT,
    GOAL_COUNT,
    ASSIST_COUNT,
    CLEAN_SHEET_COUNT,
}

enum class SortDirection {
    ASC,
    DESC,
}

data class TeamAttendanceStatisticsResponse(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val totalMatchCount: Int,
    val totalTrainingCount: Int,
    val page: Int,
    val pageSize: Int,
    val totalElements: Int,
    val totalPages: Int,
    val members: List<TeamAttendanceMemberResponse>,
)

data class TeamAttendanceMemberResponse(
    val teamMemberId: Long,
    val name: String,
    val attendanceCount: Int,
    val eligibleMatchCount: Int,
    val attendanceRate: Double,
    val trainingAttendanceCount: Int,
    val trainingEligibleMatchCount: Int,
    val trainingAttendanceRate: Double,
    val postVoteAbsenceCount: Int,
    val lateCount: Int,
    val goalCount: Int,
    val assistCount: Int,
    val cleanSheetCount: Int,
)
