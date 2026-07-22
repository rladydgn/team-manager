package com.yonghoo.team_manager.match.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class MatchParticipantEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<MatchParticipantEntity>(MatchParticipantsTable)

    var matchId by MatchParticipantsTable.matchId
    var teamMemberId by MatchParticipantsTable.teamMemberId
    var teamSide by MatchParticipantsTable.teamSide
    var status by MatchParticipantsTable.status
    var participated by MatchParticipantsTable.participated
    var goalCount by MatchParticipantsTable.goalCount
    var assistCount by MatchParticipantsTable.assistCount
    var cleanSheetCount by MatchParticipantsTable.cleanSheetCount
    var memo by MatchParticipantsTable.memo
    var respondedAt by MatchParticipantsTable.respondedAt
    var createdAt by MatchParticipantsTable.createdAt
    var updatedAt by MatchParticipantsTable.updatedAt
    var deletedAt by MatchParticipantsTable.deletedAt
}
