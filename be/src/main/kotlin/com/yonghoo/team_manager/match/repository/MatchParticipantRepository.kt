package com.yonghoo.team_manager.match.repository

import com.yonghoo.team_manager.match.domain.MatchParticipantEntity
import com.yonghoo.team_manager.match.domain.MatchParticipantRecord
import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchParticipantsTable
import com.yonghoo.team_manager.match.domain.MatchTeamSide
import com.yonghoo.team_manager.match.dto.MatchParticipantStatisticsUpdateRequest
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class MatchParticipantRepository {
    fun createDefaultParticipants(
        matchId: Long,
        teamMemberIds: List<Long>,
    ): List<MatchParticipantRecord> {
        val now = LocalDateTime.now()

        return teamMemberIds.map { teamMemberId ->
            val participant = MatchParticipantEntity.new {
                this.matchId = matchId
                this.teamMemberId = teamMemberId
                teamSide = MatchTeamSide.HOME
                status = MatchParticipantStatus.PENDING
                participated = false
                goalCount = 0
                assistCount = 0
                cleanSheetCount = 0
                memo = null
                respondedAt = null
                createdAt = now
                updatedAt = now
            }

            MatchParticipantRecord.from(participant)
        }
    }

    fun selectParticipantsByMatchIds(matchIds: List<Long>): List<MatchParticipantRecord> {
        if (matchIds.isEmpty()) {
            return emptyList()
        }

        return MatchParticipantEntity.find {
            (MatchParticipantsTable.matchId inList matchIds) and MatchParticipantsTable.deletedAt.isNull()
        }.map(MatchParticipantRecord::from)
    }

    fun upsertParticipation(
        matchId: Long,
        teamMemberId: Long,
        status: MatchParticipantStatus,
        memo: String?,
        shouldUpdateMemo: Boolean,
    ): MatchParticipantRecord {
        val now = LocalDateTime.now()
        val existingParticipant = MatchParticipantEntity.find {
            (MatchParticipantsTable.matchId eq matchId) and
                (MatchParticipantsTable.teamMemberId eq teamMemberId) and
                MatchParticipantsTable.deletedAt.isNull()
        }.firstOrNull()

        if (existingParticipant != null) {
            val statusChanged = existingParticipant.status != status
            existingParticipant.status = status
            if (shouldUpdateMemo) {
                existingParticipant.memo = memo
            }
            if (statusChanged || existingParticipant.respondedAt == null) {
                existingParticipant.respondedAt = now
            }
            existingParticipant.updatedAt = now
            return MatchParticipantRecord.from(existingParticipant)
        }

        val participant = MatchParticipantEntity.new {
            this.matchId = matchId
            this.teamMemberId = teamMemberId
            teamSide = MatchTeamSide.HOME
            this.status = status
            participated = false
            goalCount = 0
            assistCount = 0
            cleanSheetCount = 0
            this.memo = memo
            respondedAt = now
            createdAt = now
            updatedAt = now
        }

        return MatchParticipantRecord.from(participant)
    }

    fun upsertMatchStatistics(
        matchId: Long,
        statistics: List<MatchParticipantStatisticsUpdateRequest>,
    ): List<MatchParticipantRecord> {
        val existingByMemberId = MatchParticipantEntity.find {
            (MatchParticipantsTable.matchId eq matchId) and MatchParticipantsTable.deletedAt.isNull()
        }.associateBy { it.teamMemberId }
        val now = LocalDateTime.now()

        return statistics.map { statistic ->
            val participant = existingByMemberId[statistic.teamMemberId] ?: MatchParticipantEntity.new {
                this.matchId = matchId
                teamMemberId = statistic.teamMemberId
                teamSide = MatchTeamSide.HOME
                status = MatchParticipantStatus.PENDING
                participated = false
                memo = null
                respondedAt = null
                createdAt = now
                updatedAt = now
            }

            participant.goalCount = statistic.goalCount
            participant.assistCount = statistic.assistCount
            participant.cleanSheetCount = statistic.cleanSheetCount
            participant.updatedAt = now

            MatchParticipantRecord.from(participant)
        }
    }
}
