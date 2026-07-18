package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object TeamHistoriesTable : LongIdTable("team_histories") {
    val teamId = long("team_id")
    val action = enumerationByName("action", 20, TeamHistoryAction::class)
    val changedByUserId = long("changed_by_user_id")
    val beforeSnapshot = text("before_snapshot")
    val afterSnapshot = text("after_snapshot").nullable()
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
}
