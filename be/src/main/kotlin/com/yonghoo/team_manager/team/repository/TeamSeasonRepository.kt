package com.yonghoo.team_manager.team.repository

import com.yonghoo.team_manager.team.domain.TeamSeasonEntity
import com.yonghoo.team_manager.team.domain.TeamSeasonRecord
import com.yonghoo.team_manager.team.domain.TeamSeasonsTable
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.LocalDateTime

@Repository
class TeamSeasonRepository {
    fun create(
        teamId: Long,
        userId: Long,
        name: String,
        startDate: LocalDate,
        endDate: LocalDate,
        isDefault: Boolean,
        sortOrder: Int,
    ): TeamSeasonRecord {
        val now = LocalDateTime.now()
        return TeamSeasonEntity.new {
            this.teamId = teamId
            this.name = name
            this.startDate = startDate
            this.endDate = endDate
            this.isDefault = isDefault
            this.sortOrder = sortOrder
            createdByUserId = userId
            createdAt = now
            updatedAt = now
        }.let(TeamSeasonRecord::from)
    }

    fun selectByTeamId(teamId: Long): List<TeamSeasonRecord> = TeamSeasonEntity.find {
        (TeamSeasonsTable.teamId eq teamId) and TeamSeasonsTable.deletedAt.isNull()
    }.map(TeamSeasonRecord::from)

    fun selectById(teamId: Long, seasonId: Long): TeamSeasonRecord? = TeamSeasonEntity.find {
        (TeamSeasonsTable.id eq seasonId) and
            (TeamSeasonsTable.teamId eq teamId) and
            TeamSeasonsTable.deletedAt.isNull()
    }.firstOrNull()?.let(TeamSeasonRecord::from)

    fun clearDefault(teamId: Long) {
        TeamSeasonEntity.find {
            (TeamSeasonsTable.teamId eq teamId) and TeamSeasonsTable.deletedAt.isNull()
        }.forEach { season ->
            if (season.isDefault) {
                season.isDefault = false
                season.updatedAt = LocalDateTime.now()
            }
        }
    }

    fun setDefault(seasonId: Long) {
        TeamSeasonEntity[seasonId].apply {
            isDefault = true
            updatedAt = LocalDateTime.now()
        }
    }

    fun updateSortOrders(seasonIds: List<Long>) {
        val now = LocalDateTime.now()
        seasonIds.forEachIndexed { index, seasonId ->
            TeamSeasonEntity[seasonId].apply {
                sortOrder = index
                updatedAt = now
            }
        }
    }
}
