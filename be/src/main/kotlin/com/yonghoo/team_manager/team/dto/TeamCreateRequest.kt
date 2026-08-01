package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamCategory
import java.time.LocalDate

data class TeamCreateRequest(
    val name: String,
    val category: TeamCategory = TeamCategory.SOCCER,
    val shortName: String? = null,
    val logoUrl: String? = null,
    val description: String? = null,
    val region: String? = null,
    val homeStadium: String? = null,
    val foundedAt: LocalDate? = null,
    val teamColor: String? = null,
)
