package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import java.time.LocalDateTime

data class MatchParticipantResponse(
    val teamMemberId: Long,
    val status: MatchParticipantStatus,
    val memo: String?,
    val respondedAt: LocalDateTime?,
)
