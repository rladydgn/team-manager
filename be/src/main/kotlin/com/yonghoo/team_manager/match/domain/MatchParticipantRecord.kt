package com.yonghoo.team_manager.match.domain

import java.time.LocalDateTime

data class MatchParticipantRecord(
    val id: Long,
    val matchId: Long,
    val teamMemberId: Long,
    val voteStatus: MatchParticipantStatus,
    val actualParticipated: Boolean,
    val goalCount: Int,
    val assistCount: Int,
    val cleanSheetCount: Int,
    val memo: String?,
    val respondedAt: LocalDateTime?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    companion object {
        fun from(participant: MatchParticipantEntity): MatchParticipantRecord {
            return MatchParticipantRecord(
                id = participant.id.value,
                matchId = participant.matchId,
                teamMemberId = participant.teamMemberId,
                voteStatus = participant.voteStatus,
                actualParticipated = participant.actualParticipated,
                goalCount = participant.goalCount,
                assistCount = participant.assistCount,
                cleanSheetCount = participant.cleanSheetCount,
                memo = participant.memo,
                respondedAt = participant.respondedAt,
                createdAt = participant.createdAt,
                updatedAt = participant.updatedAt,
            )
        }
    }
}
