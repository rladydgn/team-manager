package com.yonghoo.team_manager.match.dto

import java.time.LocalDate

data class TeamPlayerRankingsResponse(
    val startDate: LocalDate,
    val endDate: LocalDate,
    // 훈련을 포함하며, 취소되지 않은 종료 경기 또는 점수가 기록된 경기 수
    val completedMatchCount: Int,
    val goalRankings: List<TeamPlayerRankingEntryResponse>,
    val assistRankings: List<TeamPlayerRankingEntryResponse>,
    val cleanSheetRankings: List<TeamPlayerRankingEntryResponse>,
)

data class TeamPlayerRankingEntryResponse(
    val rank: Int,
    val teamMemberId: Long,
    val name: String,
    val value: Int,
    val isCurrentUser: Boolean,
)
