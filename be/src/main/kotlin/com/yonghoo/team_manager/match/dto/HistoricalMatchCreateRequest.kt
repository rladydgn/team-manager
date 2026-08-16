package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchType
import java.time.LocalDateTime

data class HistoricalMatchCreateRequest(
    val teamId: Long,
    val matchType: MatchType,
    val opponentTeamName: String? = null,
    val matchAt: LocalDateTime,
    val location: String? = null,
    val participants: List<HistoricalMatchParticipantCreateRequest>,
)

data class HistoricalMatchParticipantCreateRequest(
    val teamMemberId: Long,
    val voteStatus: MatchParticipantStatus,
)

data class HistoricalMatchParticipantsUpdateRequest(
    val participants: List<HistoricalMatchParticipantCreateRequest>,
)
