package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchParticipantStatus

data class MatchParticipationUpdateRequest(
    val voteStatus: MatchParticipantStatus,
    val memo: String? = null,
)
