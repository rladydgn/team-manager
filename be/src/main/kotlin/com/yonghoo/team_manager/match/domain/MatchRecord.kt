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
    val location: String?,
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
                location = match.location,
                status = match.status,
                createdAt = match.createdAt,
                updatedAt = match.updatedAt,
                deletedAt = match.deletedAt,
            )
        }
    }
}
