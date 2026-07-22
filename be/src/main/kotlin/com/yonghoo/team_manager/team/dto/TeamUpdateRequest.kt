package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamCategory
import java.time.LocalDate

data class TeamUpdateRequest(
    val name: String,
    val category: TeamCategory? = null,
    val shortName: String? = null,
    val logoUrl: String? = null,
    val description: String? = null,
    val region: String? = null,
    val homeStadium: String? = null,
    val foundedAt: LocalDate? = null,
    val teamColor: String? = null,
)
