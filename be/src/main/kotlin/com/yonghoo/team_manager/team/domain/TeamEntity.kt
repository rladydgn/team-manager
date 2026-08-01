package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class TeamEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TeamEntity>(TeamsTable)

    var createdByUserId by TeamsTable.createdByUserId
    var category by TeamsTable.category
    var name by TeamsTable.name
    var shortName by TeamsTable.shortName
    var logoUrl by TeamsTable.logoUrl
    var description by TeamsTable.description
    var region by TeamsTable.region
    var homeStadium by TeamsTable.homeStadium
    var foundedAt by TeamsTable.foundedAt
    var teamColor by TeamsTable.teamColor
    var status by TeamsTable.status
    var createdAt by TeamsTable.createdAt
    var updatedAt by TeamsTable.updatedAt
    var deletedAt by TeamsTable.deletedAt
}
