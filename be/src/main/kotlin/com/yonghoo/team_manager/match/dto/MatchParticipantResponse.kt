package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import java.time.LocalDateTime

data class MatchParticipantResponse(
    val teamMemberId: Long,
    val voteStatus: MatchParticipantStatus,
    val actualParticipated: Boolean,
    val late: Boolean,
    val goalCount: Int,
    val assistCount: Int,
    val cleanSheetCount: Int,
    val memo: String?,
    val respondedAt: LocalDateTime?,
    val name: String? = null,
    val role: TeamMemberRole? = null,
)
