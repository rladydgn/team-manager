package com.yonghoo.team_manager.match.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime

object MatchParticipationHistoriesTable : LongIdTable("match_participation_histories") {
    val matchId = long("match_id")
    val teamMemberId = long("team_member_id")
    val actorUserId = long("actor_user_id")
    val actorName = varchar("actor_name", 50)
    val responseSource = enumerationByName("response_source", 10, ParticipationSource::class)
    val previousStatus = enumerationByName("previous_status", 20, MatchParticipantStatus::class).nullable()
    val voteStatus = enumerationByName("vote_status", 20, MatchParticipantStatus::class)
    val reason = varchar("reason", 500).nullable()
    val changedAt = datetime("changed_at")

    init { index("idx_match_participation_histories_match_member", false, matchId, teamMemberId) }
}
