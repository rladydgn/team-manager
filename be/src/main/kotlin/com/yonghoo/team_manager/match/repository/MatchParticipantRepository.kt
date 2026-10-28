package com.yonghoo.team_manager.match.repository

import com.yonghoo.team_manager.match.domain.MatchParticipantEntity
import com.yonghoo.team_manager.match.domain.MatchParticipantRecord
import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchParticipantsTable
import com.yonghoo.team_manager.match.domain.MatchTeamSide
import com.yonghoo.team_manager.match.domain.ParticipationSource
import com.yonghoo.team_manager.match.domain.MatchParticipationHistoriesTable
import com.yonghoo.team_manager.match.dto.ParticipationHistoryResponse
import com.yonghoo.team_manager.match.dto.HistoricalMatchParticipantCreateRequest
import com.yonghoo.team_manager.match.dto.MatchParticipantStatisticsUpdateRequest
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.core.SortOrder
import java.time.LocalDateTime

@Repository
class MatchParticipantRepository {
    fun createDefaultParticipants(
        matchId: Long,
        teamMemberIds: List<Long>,
    ): List<MatchParticipantRecord> {
        val initialSide = lockMatchForParticipantWrite(matchId)
        val now = LocalDateTime.now()

        return teamMemberIds.map { teamMemberId ->
            val participant = MatchParticipantEntity.new {
                this.matchId = matchId
                this.teamMemberId = teamMemberId
                teamSide = initialSide
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
        val initialSide = lockMatchForParticipantWrite(matchId)
        val now = LocalDateTime.now()

        return participants.map { participantRequest ->
            val participant = MatchParticipantEntity.new {
                this.matchId = matchId
                teamMemberId = participantRequest.teamMemberId
                teamSide = initialSide
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
        val initialSide = lockMatchForParticipantWrite(matchId)
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
                    teamSide = initialSide
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

            if (participant.voteStatus != participantRequest.voteStatus) participant.participationSource = null
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
        actorUserId: Long? = null,
        actorName: String = "",
        source: ParticipationSource = ParticipationSource.SELF,
        reason: String? = null,
    ): MatchParticipantRecord {
        val initialSide = lockMatchForParticipantWrite(matchId)
        val now = LocalDateTime.now()
        val existingParticipant = MatchParticipantEntity.find {
            (MatchParticipantsTable.matchId eq matchId) and
                (MatchParticipantsTable.teamMemberId eq teamMemberId)
        }.toList().sortedWith(compareBy<MatchParticipantEntity> { it.deletedAt != null }.thenByDescending { it.id.value }).firstOrNull()

        val previousStatus = existingParticipant?.takeIf { it.deletedAt == null }?.voteStatus
        // Memo-only self saves retain the source and response time of the actual vote.
        val shouldRecord = source == ParticipationSource.PROXY || existingParticipant == null ||
            existingParticipant.deletedAt != null || existingParticipant.voteStatus != voteStatus ||
            existingParticipant.respondedAt == null
        if (actorUserId != null && shouldRecord) {
            MatchParticipationHistoriesTable.insert {
                it[this.matchId] = matchId
                it[this.teamMemberId] = teamMemberId
                it[this.actorUserId] = actorUserId
                it[this.actorName] = actorName
                it[responseSource] = source
                it[this.previousStatus] = previousStatus
                it[this.voteStatus] = voteStatus
                it[this.reason] = reason
                it[changedAt] = now
            }
        }

        if (existingParticipant != null) {
            existingParticipant.deletedAt = null
            val voteStatusChanged = existingParticipant.voteStatus != voteStatus
            existingParticipant.voteStatus = voteStatus
            if (actorUserId != null && shouldRecord) existingParticipant.participationSource = source
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
            teamSide = initialSide
            this.voteStatus = voteStatus
            actualParticipated = false
            late = false
            goalCount = 0
            assistCount = 0
            cleanSheetCount = 0
            this.memo = memo
            respondedAt = now
            participationSource = if (actorUserId != null) source else null
            createdAt = now
            updatedAt = now
        }

        return MatchParticipantRecord.from(participant)
    }

    fun selectParticipationHistory(matchId: Long, teamMemberId: Long): List<ParticipationHistoryResponse> =
        MatchParticipationHistoriesTable.selectAll().where {
            (MatchParticipationHistoriesTable.matchId eq matchId) and
                (MatchParticipationHistoriesTable.teamMemberId eq teamMemberId)
        }.orderBy(MatchParticipationHistoriesTable.id to SortOrder.DESC).map {
            ParticipationHistoryResponse(
                id = it[MatchParticipationHistoriesTable.id].value,
                actorName = it[MatchParticipationHistoriesTable.actorName],
                source = it[MatchParticipationHistoriesTable.responseSource],
                previousStatus = it[MatchParticipationHistoriesTable.previousStatus],
                voteStatus = it[MatchParticipationHistoriesTable.voteStatus],
                reason = it[MatchParticipationHistoriesTable.reason],
                changedAt = it[MatchParticipationHistoriesTable.changedAt],
            )
        }

    fun removeParticipant(
        matchId: Long,
        teamMemberId: Long,
    ) {
        lockMatchForParticipantWrite(matchId)
        val participant = MatchParticipantEntity.wrapRows(MatchParticipantsTable.selectAll().where {
            (MatchParticipantsTable.matchId eq matchId) and
                (MatchParticipantsTable.teamMemberId eq teamMemberId) and
                MatchParticipantsTable.deletedAt.isNull()
        }.forUpdate()).firstOrNull() ?: return
        val now = LocalDateTime.now()

        participant.deletedAt = now
        participant.updatedAt = now
    }

    fun upsertMatchStatistics(
        matchId: Long,
        statistics: List<MatchParticipantStatisticsUpdateRequest>,
        updateSides: Boolean = false,
    ): List<MatchParticipantRecord> {
        lockMatchForParticipantWrite(matchId)
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
            if (updateSides) participant.teamSide = requireNotNull(statistic.teamSide)
            participant.updatedAt = now

            MatchParticipantRecord.from(participant)
        }
    }
}
