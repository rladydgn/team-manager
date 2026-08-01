package com.yonghoo.team_manager.match.dto

data class MatchParticipantStatisticsUpdateRequest(
    val teamMemberId: Long,
    val goalCount: Int,
    val assistCount: Int,
    val cleanSheetCount: Int,
)
