package com.yonghoo.team_manager.team.domain

import java.time.LocalDate
import java.time.LocalDateTime

data class TeamSeasonRecord(
    val id: Long,
    val teamId: Long,
    val name: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val isDefault: Boolean,
    val sortOrder: Int,
    val createdByUserId: Long,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    companion object {
        fun from(entity: TeamSeasonEntity) = TeamSeasonRecord(
            id = entity.id.value,
            teamId = entity.teamId,
            name = entity.name,
            startDate = entity.startDate,
            endDate = entity.endDate,
            isDefault = entity.isDefault,
            sortOrder = entity.sortOrder,
            createdByUserId = entity.createdByUserId,
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt,
        )
    }
}
