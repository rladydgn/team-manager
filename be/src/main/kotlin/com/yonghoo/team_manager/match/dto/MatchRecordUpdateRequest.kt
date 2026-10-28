package com.yonghoo.team_manager.match.dto

data class MatchRecordUpdateRequest(
    val opponentScore: Int,
    val unknownGoalCount: Int = 0,
    val unknownAssistCount: Int = 0,
    val participants: List<MatchParticipantStatisticsUpdateRequest>,
    val internalRecord: InternalMatchRecordUpdateRequest? = null,
)

data class InternalMatchRecordUpdateRequest(
    val sideAssignmentVersion: Long,
    val homeUnknownGoalCount: Int,
    val homeUnknownAssistCount: Int,
    val awayUnknownGoalCount: Int,
    val awayUnknownAssistCount: Int,
    val confirmLegacyConversion: Boolean = false,
)
