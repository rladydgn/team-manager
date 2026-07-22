package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.date
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object TeamsTable : LongIdTable("teams") {
    val createdByUserId = long("created_by_user_id")
    val category = enumerationByName("category", 30, TeamCategory::class).clientDefault { TeamCategory.SOCCER }
    val name = varchar("name", 100)
    val shortName = varchar("short_name", 30).nullable()
    val logoUrl = varchar("logo_url", 500).nullable()
    val description = text("description").nullable()
    val region = varchar("region", 100).nullable()
    val homeStadium = varchar("home_stadium", 100).nullable()
    val foundedAt = date("founded_at").nullable()
    val teamColor = varchar("team_color", 20).nullable()
    val status = enumerationByName("status", 20, TeamStatus::class).clientDefault { TeamStatus.ACTIVE }
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt = datetime("updated_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
