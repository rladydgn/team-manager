package com.yonghoo.team_manager.match.dto

data class MatchRecordUpdateRequest(
    val opponentScore: Int,
    val unknownGoalCount: Int = 0,
    val unknownAssistCount: Int = 0,
    val participants: List<MatchParticipantStatisticsUpdateRequest>,
)
