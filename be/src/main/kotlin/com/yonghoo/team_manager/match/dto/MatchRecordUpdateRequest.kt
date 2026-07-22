package com.yonghoo.team_manager.match.dto

data class MatchRecordUpdateRequest(
    val opponentScore: Int,
    val participants: List<MatchParticipantStatisticsUpdateRequest>,
)
