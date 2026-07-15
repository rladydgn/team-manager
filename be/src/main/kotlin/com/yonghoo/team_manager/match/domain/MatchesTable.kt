package com.yonghoo.team_manager.match.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object MatchesTable : LongIdTable("matches") {
    val teamId = long("team_id")
    val matchType = enumerationByName("match_type", 20, MatchType::class)
    val opponentTeamId = long("opponent_team_id").nullable()
    val opponentTeamName = varchar("opponent_team_name", 100).nullable()
    val createdByUserId = long("created_by_user_id")
    val matchAt = datetime("match_at")
    val location = varchar("location", 255).nullable()
    val status = enumerationByName("status", 20, MatchStatus::class).clientDefault { MatchStatus.SCHEDULED }
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt = datetime("updated_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
