package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class TeamMemberEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TeamMemberEntity>(TeamMembersTable)

    var teamId by TeamMembersTable.teamId
    var userId: Long? by TeamMembersTable.userId
    var role by TeamMembersTable.role
    var status by TeamMembersTable.status
    var joinedAt by TeamMembersTable.joinedAt
    var createdAt by TeamMembersTable.createdAt
    var updatedAt by TeamMembersTable.updatedAt
    var deletedAt by TeamMembersTable.deletedAt
}
