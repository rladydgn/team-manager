package com.yonghoo.team_manager.match.domain

import java.time.LocalDateTime

data class MatchRecord(
    val id: Long,
    val teamId: Long,
    val matchType: MatchType,
    val opponentTeamId: Long?,
    val opponentTeamName: String?,
    val createdByUserId: Long,
    val matchAt: LocalDateTime,
    val participationDeadlineAt: LocalDateTime,
    val location: String?,
    val teamScore: Int?,
    val unknownGoalCount: Int,
    val opponentScore: Int?,
    val unknownAssistCount: Int,
    val status: MatchStatus,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val deletedAt: LocalDateTime?,
) {
    companion object {
        fun from(match: MatchEntity): MatchRecord {
            return MatchRecord(
                id = match.id.value,
                teamId = match.teamId,
                matchType = match.matchType,
                opponentTeamId = match.opponentTeamId,
                opponentTeamName = match.opponentTeamName,
                createdByUserId = match.createdByUserId,
                matchAt = match.matchAt,
                participationDeadlineAt = match.participationDeadlineAt,
                location = match.location,
                teamScore = match.teamScore,
                unknownGoalCount = match.unknownGoalCount,
                opponentScore = match.opponentScore,
                unknownAssistCount = match.unknownAssistCount,
                status = match.status,
                createdAt = match.createdAt,
                updatedAt = match.updatedAt,
                deletedAt = match.deletedAt,
            )
        }
    }
}
