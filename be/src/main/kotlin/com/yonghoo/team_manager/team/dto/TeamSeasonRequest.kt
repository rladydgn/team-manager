package com.yonghoo.team_manager.team.dto

import java.time.LocalDate

data class TeamSeasonCreateRequest(
    val name: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
)

data class TeamSeasonOrderUpdateRequest(
    val seasonIds: List<Long>,
)
