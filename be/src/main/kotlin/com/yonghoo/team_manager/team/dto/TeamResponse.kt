package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamRecord
import com.yonghoo.team_manager.team.domain.TeamCategory
import com.yonghoo.team_manager.team.domain.TeamStatus
import java.time.LocalDate
import java.time.LocalDateTime

data class TeamResponse(
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
) {
    companion object {
        fun from(team: TeamRecord): TeamResponse {
            return TeamResponse(
                id = team.id,
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
            )
        }
    }
}
