package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID

class TeamMemberEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TeamMemberEntity>(TeamMembersTable)

    var teamId by TeamMembersTable.teamId
    var userId by TeamMembersTable.userId
    var role by TeamMembersTable.role
    var status by TeamMembersTable.status
    var joinedAt by TeamMembersTable.joinedAt
    var createdAt by TeamMembersTable.createdAt
    var updatedAt by TeamMembersTable.updatedAt
    var deletedAt by TeamMembersTable.deletedAt
}
