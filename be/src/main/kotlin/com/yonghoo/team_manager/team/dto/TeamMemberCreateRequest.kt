package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.PlayerPosition
import java.math.BigDecimal

data class TeamMemberCreateRequest(
    val displayName: String,
    val role: TeamMemberRole,
    val mainPosition: PlayerPosition? = null,
    val jerseyNumber: BigDecimal? = null,
)
