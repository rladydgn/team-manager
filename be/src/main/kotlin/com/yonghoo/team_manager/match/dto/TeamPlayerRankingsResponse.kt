package com.yonghoo.team_manager.match.dto

import java.time.LocalDate

data class TeamPlayerRankingsResponse(
    val startDate: LocalDate,
    val endDate: LocalDate,
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
