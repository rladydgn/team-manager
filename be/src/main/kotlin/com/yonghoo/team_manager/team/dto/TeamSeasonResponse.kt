package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamSeasonRecord
import java.time.LocalDate
import java.time.LocalDateTime

data class TeamSeasonResponse(
    val id: Long,
    val name: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val isDefault: Boolean,
    val sortOrder: Int,
    val createdAt: LocalDateTime,
) {
    companion object {
        fun from(season: TeamSeasonRecord) = TeamSeasonResponse(
            id = season.id,
            name = season.name,
            startDate = season.startDate,
            endDate = season.endDate,
            isDefault = season.isDefault,
            sortOrder = season.sortOrder,
            createdAt = season.createdAt,
        )
    }
}
