package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchType
import java.time.LocalDateTime

data class MatchCreateRequest(
    val teamId: Long,
    val matchType: MatchType,
    val opponentTeamId: Long? = null,
    val opponentTeamName: String? = null,
    val matchAt: LocalDateTime,
    val location: String? = null,
)
