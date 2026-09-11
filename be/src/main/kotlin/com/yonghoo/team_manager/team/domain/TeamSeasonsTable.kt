package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.date
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object TeamSeasonsTable : LongIdTable("team_seasons") {
    val teamId = long("team_id")
    val name = varchar("name", 50)
    val startDate = date("start_date")
    val endDate = date("end_date")
    val isDefault = bool("is_default").clientDefault { false }
    val sortOrder = integer("sort_order").clientDefault { 0 }
    val createdByUserId = long("created_by_user_id")
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt = datetime("updated_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
