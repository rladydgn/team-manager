package com.yonghoo.team_manager.match.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class MatchEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<MatchEntity>(MatchesTable)

    var teamId by MatchesTable.teamId
    var matchType by MatchesTable.matchType
    var opponentTeamId by MatchesTable.opponentTeamId
    var opponentTeamName by MatchesTable.opponentTeamName
    var createdByUserId by MatchesTable.createdByUserId
    var matchAt by MatchesTable.matchAt
    var location by MatchesTable.location
    var teamScore by MatchesTable.teamScore
    var opponentScore by MatchesTable.opponentScore
    var status by MatchesTable.status
    var createdAt by MatchesTable.createdAt
    var updatedAt by MatchesTable.updatedAt
    var deletedAt by MatchesTable.deletedAt
}
