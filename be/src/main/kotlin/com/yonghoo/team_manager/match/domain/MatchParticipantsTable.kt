package com.yonghoo.team_manager.match.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object MatchParticipantsTable : LongIdTable("match_participants") {
    val matchId = long("match_id")
    val teamMemberId = long("team_member_id")
    val teamSide = enumerationByName("team_side", 10, MatchTeamSide::class).clientDefault { MatchTeamSide.HOME }
    val status = enumerationByName("status", 20, MatchParticipantStatus::class).clientDefault { MatchParticipantStatus.PENDING }
    val participated = bool("participated").clientDefault { false }
    val memo = varchar("memo", 500).nullable()
    val respondedAt = datetime("responded_at").nullable()
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt = datetime("updated_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
