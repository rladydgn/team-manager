package com.yonghoo.team_manager.team.domain

import java.time.LocalDate
import java.time.LocalDateTime

data class TeamRecord(
    val id: Long,
    val createdByUserId: Long,
    val category: TeamCategory,
    val name: String,
    val shortName: String?,
    val logoUrl: String?,
    val description: String?,
    val region: String?,
    val homeStadium: String?,
    val foundedAt: LocalDate?,
    val teamColor: String?,
    val status: TeamStatus,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val deletedAt: LocalDateTime?,
) {
    companion object {
        fun from(team: TeamEntity): TeamRecord {
            return TeamRecord(
                id = team.id.value,
                createdByUserId = team.createdByUserId,
                category = team.category,
                name = team.name,
                shortName = team.shortName,
                logoUrl = team.logoUrl,
                description = team.description,
                region = team.region,
                homeStadium = team.homeStadium,
                foundedAt = team.foundedAt,
                teamColor = team.teamColor,
                status = team.status,
                createdAt = team.createdAt,
                updatedAt = team.updatedAt,
                deletedAt = team.deletedAt,
            )
        }
    }
}
