package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.PlayerPosition
import java.math.BigDecimal

data class TeamMemberPlayerProfileRequest(
    val mainPosition: PlayerPosition? = null,
    val jerseyNumber: BigDecimal? = null,
)
