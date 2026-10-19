package com.yonghoo.team_manager.match.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime

object MatchFormationsTable : LongIdTable("match_formations") {
    val matchId = long("match_id")
    val title = varchar("title", 50)
    val side = enumerationByName("side", 20, MatchTeamSide::class)
    val templateId = varchar("template_id", 20)
    val version = long("version").default(1)
    val createdByUserId = long("created_by_user_id")
    val updatedByUserId = long("updated_by_user_id")
    val createdAt = datetime("created_at")
    val updatedAt = datetime("updated_at")
    val deletedAt = datetime("deleted_at").nullable()
    init { index(false, matchId, deletedAt) }
}

object MatchFormationPlacementsTable : LongIdTable("match_formation_placements") {
    val formationId = long("formation_id").index()
    val slotId = varchar("slot_id", 20)
    val teamMemberId = long("team_member_id")
}
