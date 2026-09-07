package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchRecord
import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchStatus
import com.yonghoo.team_manager.match.domain.MatchType
import java.time.LocalDateTime

data class MatchResponse(
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
    val availableParticipantCount: Int,
    val isMatchParticipant: Boolean,
    val myVoteStatus: MatchParticipantStatus,
) {
    companion object {
        fun from(
            match: MatchRecord,
            availableParticipantCount: Int = 0,
            isMatchParticipant: Boolean = false,
            myVoteStatus: MatchParticipantStatus = MatchParticipantStatus.PENDING,
        ): MatchResponse {
            return MatchResponse(
                id = match.id,
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
                availableParticipantCount = availableParticipantCount,
                isMatchParticipant = isMatchParticipant,
                myVoteStatus = myVoteStatus,
            )
        }
    }
}
