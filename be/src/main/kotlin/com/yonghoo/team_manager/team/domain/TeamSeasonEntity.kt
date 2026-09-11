package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class TeamSeasonEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TeamSeasonEntity>(TeamSeasonsTable)

    var teamId by TeamSeasonsTable.teamId
    var name by TeamSeasonsTable.name
    var startDate by TeamSeasonsTable.startDate
    var endDate by TeamSeasonsTable.endDate
    var isDefault by TeamSeasonsTable.isDefault
    var sortOrder by TeamSeasonsTable.sortOrder
    var createdByUserId by TeamSeasonsTable.createdByUserId
    var createdAt by TeamSeasonsTable.createdAt
    var updatedAt by TeamSeasonsTable.updatedAt
    var deletedAt by TeamSeasonsTable.deletedAt
}
