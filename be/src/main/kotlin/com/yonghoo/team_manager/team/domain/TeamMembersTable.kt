package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object TeamMembersTable : LongIdTable("team_members") {
    val teamId = long("team_id")
    val userId = long("user_id").nullable()
    val role = enumerationByName("role", 20, TeamMemberRole::class).clientDefault { TeamMemberRole.MEMBER }
    val status = enumerationByName("status", 20, TeamMemberStatus::class).clientDefault { TeamMemberStatus.ACTIVE }
    val joinedAt = datetime("joined_at").nullable()
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt = datetime("updated_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
