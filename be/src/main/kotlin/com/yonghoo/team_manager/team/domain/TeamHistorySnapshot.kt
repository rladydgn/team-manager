package com.yonghoo.team_manager.team.domain

import java.time.LocalDate

data class TeamHistorySnapshot(
    val id: Long,
    val createdByUserId: Long,
    val name: String,
    val shortName: String?,
    val logoUrl: String?,
    val description: String?,
    val region: String?,
    val homeStadium: String?,
    val foundedAt: LocalDate?,
    val teamColor: String?,
    val status: TeamStatus,
) {
    companion object {
        fun from(team: TeamRecord): TeamHistorySnapshot {
            return TeamHistorySnapshot(
                id = team.id,
                createdByUserId = team.createdByUserId,
                name = team.name,
                shortName = team.shortName,
                logoUrl = team.logoUrl,
                description = team.description,
                region = team.region,
                homeStadium = team.homeStadium,
                foundedAt = team.foundedAt,
                teamColor = team.teamColor,
                status = team.status,
            )
        }
    }
}
