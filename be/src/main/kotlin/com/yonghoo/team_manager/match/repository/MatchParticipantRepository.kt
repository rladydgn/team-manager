package com.yonghoo.team_manager.match.repository

import com.yonghoo.team_manager.match.domain.MatchParticipantEntity
import com.yonghoo.team_manager.match.domain.MatchParticipantRecord
import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchParticipantsTable
import com.yonghoo.team_manager.match.domain.MatchTeamSide
import com.yonghoo.team_manager.match.dto.HistoricalMatchParticipantCreateRequest
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
                voteStatus = MatchParticipantStatus.PENDING
                actualParticipated = false
                late = false
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

    fun createHistoricalParticipants(
        matchId: Long,
        participants: List<HistoricalMatchParticipantCreateRequest>,
    ): List<MatchParticipantRecord> {
        val now = LocalDateTime.now()

        return participants.map { participantRequest ->
            val participant = MatchParticipantEntity.new {
                this.matchId = matchId
                teamMemberId = participantRequest.teamMemberId
                teamSide = MatchTeamSide.HOME
                voteStatus = participantRequest.voteStatus
                actualParticipated = participantRequest.voteStatus == MatchParticipantStatus.AVAILABLE
                late = false
                goalCount = 0
                assistCount = 0
                cleanSheetCount = 0
                memo = null
                respondedAt = now
                createdAt = now
                updatedAt = now
            }

            MatchParticipantRecord.from(participant)
        }
    }

    fun replaceHistoricalParticipants(
        matchId: Long,
        participants: List<HistoricalMatchParticipantCreateRequest>,
    ): List<MatchParticipantRecord> {
        val existingParticipants = MatchParticipantEntity.find {
            MatchParticipantsTable.matchId eq matchId
        }.toList()
        val activeByMemberId = existingParticipants
            .filter { it.deletedAt == null }
            .associateBy { it.teamMemberId }
        val deletedByMemberId = existingParticipants
            .filter { it.deletedAt != null }
            .associateBy { it.teamMemberId }
        val now = LocalDateTime.now()
        val selectedMemberIds = participants.map { it.teamMemberId }.toSet()

        activeByMemberId
            .filterKeys { it !in selectedMemberIds }
            .values
            .forEach { participant ->
                participant.deletedAt = now
                participant.updatedAt = now
            }

        return participants.map { participantRequest ->
            val participant = activeByMemberId[participantRequest.teamMemberId]
                ?: deletedByMemberId[participantRequest.teamMemberId]?.also { it.deletedAt = null }
                ?: MatchParticipantEntity.new {
                    this.matchId = matchId
                    teamMemberId = participantRequest.teamMemberId
                    teamSide = MatchTeamSide.HOME
                    voteStatus = participantRequest.voteStatus
                    actualParticipated = participantRequest.voteStatus == MatchParticipantStatus.AVAILABLE
                    late = false
                    goalCount = 0
                    assistCount = 0
                    cleanSheetCount = 0
                    memo = null
                    respondedAt = now
                    createdAt = now
                    updatedAt = now
                }

            participant.voteStatus = participantRequest.voteStatus
            participant.updatedAt = now

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
        voteStatus: MatchParticipantStatus,
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
            val voteStatusChanged = existingParticipant.voteStatus != voteStatus
            existingParticipant.voteStatus = voteStatus
            if (shouldUpdateMemo) {
                existingParticipant.memo = memo
            }
            if (voteStatusChanged || existingParticipant.respondedAt == null) {
                existingParticipant.respondedAt = now
            }
            existingParticipant.updatedAt = now
            return MatchParticipantRecord.from(existingParticipant)
        }

        val participant = MatchParticipantEntity.new {
            this.matchId = matchId
            this.teamMemberId = teamMemberId
            teamSide = MatchTeamSide.HOME
            this.voteStatus = voteStatus
            actualParticipated = false
            late = false
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
        }
            .associateBy { it.teamMemberId }
        val now = LocalDateTime.now()

        return statistics.map { statistic ->
            val participant = requireNotNull(existingByMemberId[statistic.teamMemberId])

            participant.actualParticipated = statistic.actualParticipated
            participant.late = statistic.late
            participant.goalCount = statistic.goalCount
            participant.assistCount = statistic.assistCount
            participant.cleanSheetCount = statistic.cleanSheetCount
            participant.updatedAt = now

            MatchParticipantRecord.from(participant)
        }
    }
}
