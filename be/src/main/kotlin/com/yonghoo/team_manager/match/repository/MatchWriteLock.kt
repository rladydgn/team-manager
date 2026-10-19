package com.yonghoo.team_manager.match.repository

import com.yonghoo.team_manager.match.domain.MatchesTable
import com.yonghoo.team_manager.match.domain.MatchTeamSide
import com.yonghoo.team_manager.match.domain.MatchType
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll

// All participant writers share the formation/side-assignment parent lock before reading participants.
internal fun lockMatchForParticipantWrite(matchId: Long): MatchTeamSide {
    val row = MatchesTable.selectAll().where { MatchesTable.id eq matchId }.forUpdate().single()
    return if (row[MatchesTable.matchType] == MatchType.INTERNAL) MatchTeamSide.UNASSIGNED else MatchTeamSide.HOME
}
