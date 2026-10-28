package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.ParticipationSource
import java.time.LocalDateTime

data class ProxyParticipationUpdateRequest(
    val voteStatus: MatchParticipantStatus,
    val reason: String? = null,
)

data class ParticipationHistoryResponse(
    val id: Long,
    val actorName: String,
    val source: ParticipationSource,
    val previousStatus: MatchParticipantStatus?,
    val voteStatus: MatchParticipantStatus,
    val reason: String?,
    val changedAt: LocalDateTime,
)
