package com.yonghoo.team_manager.match.dto

import java.time.LocalDate

data class TeamAttendanceStatisticsResponse(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val totalMatchCount: Int,
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
    val attendanceRate: Double,
)
