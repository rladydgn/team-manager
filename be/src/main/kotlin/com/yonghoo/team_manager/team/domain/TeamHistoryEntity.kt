package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class TeamHistoryEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TeamHistoryEntity>(TeamHistoriesTable)

    var teamId by TeamHistoriesTable.teamId
    var action by TeamHistoriesTable.action
    var changedByUserId by TeamHistoriesTable.changedByUserId
    var beforeSnapshot by TeamHistoriesTable.beforeSnapshot
    var afterSnapshot by TeamHistoriesTable.afterSnapshot
    var createdAt by TeamHistoriesTable.createdAt
}
