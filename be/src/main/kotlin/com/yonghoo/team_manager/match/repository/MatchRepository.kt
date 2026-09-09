package com.yonghoo.team_manager.match.repository

import com.yonghoo.team_manager.match.domain.MatchEntity
import com.yonghoo.team_manager.match.domain.MatchRecord
import com.yonghoo.team_manager.match.domain.MatchStatus
import com.yonghoo.team_manager.match.domain.MatchesTable
import com.yonghoo.team_manager.match.dto.MatchCreateRequest
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class MatchRepository {
    fun createMatch(
        createdByUserId: Long,
        request: MatchCreateRequest,
        opponentTeamName: String?,
        participationDeadlineAt: LocalDateTime,
        initialStatus: MatchStatus = MatchStatus.SCHEDULED,
    ): MatchRecord {
        val now = LocalDateTime.now()
        val match = MatchEntity.new {
            teamId = request.teamId
            matchType = request.matchType
            isTraining = request.isTraining
            opponentTeamId = request.opponentTeamId
            this.opponentTeamName = opponentTeamName
            this.createdByUserId = createdByUserId
            matchAt = request.matchAt
            this.participationDeadlineAt = participationDeadlineAt
            location = request.location?.trim()?.takeIf(String::isNotBlank)
            teamScore = null
            unknownGoalCount = 0
            opponentScore = null
            unknownAssistCount = 0
            status = initialStatus
            createdAt = now
            updatedAt = now
        }

        return MatchRecord.from(match)
    }

    fun updateMatchRecord(
        matchId: Long,
        teamScore: Int,
        opponentScore: Int,
        unknownGoalCount: Int,
        unknownAssistCount: Int,
    ): MatchRecord {
        val match = MatchEntity[matchId]

        match.teamScore = teamScore
        match.unknownGoalCount = unknownGoalCount
        match.opponentScore = opponentScore
        match.unknownAssistCount = unknownAssistCount
        match.status = MatchStatus.COMPLETED
        match.updatedAt = LocalDateTime.now()

        return MatchRecord.from(match)
    }

    fun selectMatchById(matchId: Long): MatchRecord? {
        return MatchEntity.find {
            (MatchesTable.id eq matchId) and MatchesTable.deletedAt.isNull()
        }.firstOrNull()?.let(MatchRecord::from)
    }

    fun selectMatchesByTeamId(teamId: Long): List<MatchRecord> {
        return MatchEntity.find {
            (MatchesTable.teamId eq teamId) and MatchesTable.deletedAt.isNull()
        }.map(MatchRecord::from).sortedByDescending(MatchRecord::matchAt)
    }
}
