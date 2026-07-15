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
    ): MatchRecord {
        val now = LocalDateTime.now()
        val match = MatchEntity.new {
            teamId = request.teamId
            matchType = request.matchType
            opponentTeamId = request.opponentTeamId
            this.opponentTeamName = opponentTeamName
            this.createdByUserId = createdByUserId
            matchAt = request.matchAt
            location = request.location?.trim()?.takeIf(String::isNotBlank)
            status = MatchStatus.SCHEDULED
            createdAt = now
            updatedAt = now
        }

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
        }.map(MatchRecord::from).sortedBy(MatchRecord::matchAt)
    }
}
