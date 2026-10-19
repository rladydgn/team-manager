package com.yonghoo.team_manager.match.domain

import java.time.LocalDateTime

data class MatchParticipantRecord(
    val id: Long,
    val matchId: Long,
    val teamMemberId: Long,
    val voteStatus: MatchParticipantStatus,
    val actualParticipated: Boolean,
    val late: Boolean,
    val goalCount: Int,
    val assistCount: Int,
    val cleanSheetCount: Int,
    val memo: String?,
    val respondedAt: LocalDateTime?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val teamSide: MatchTeamSide = MatchTeamSide.HOME,
) {
    companion object {
        fun from(participant: MatchParticipantEntity): MatchParticipantRecord {
            return MatchParticipantRecord(
                id = participant.id.value,
                matchId = participant.matchId,
                teamMemberId = participant.teamMemberId,
                teamSide = participant.teamSide,
                voteStatus = participant.voteStatus,
                actualParticipated = participant.actualParticipated,
                late = participant.late,
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
