package com.yonghoo.team_manager.match.repository

import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.team.domain.*
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.*
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

data class FormationMatch(val id: Long, val teamId: Long, val type: MatchType, val status: MatchStatus, val sideVersion: Long)
data class FormationPlayerState(
    val teamMemberId: Long, val name: String, val memberExists: Boolean,
    val participantExists: Boolean, val vote: MatchParticipantStatus?, val side: MatchTeamSide,
    val mainPosition: PlayerPosition? = null, val jerseyNumber: Int? = null,
)
data class StoredFormation(
    val id: Long, val matchId: Long, val title: String, val side: MatchTeamSide, val templateId: String,
    val version: Long, val createdAt: LocalDateTime, val updatedAt: LocalDateTime,
    val placements: List<FormationPlacementRequest>,
)

@Repository
class MatchFormationRepository {
    fun match(matchId: Long, lock: Boolean): FormationMatch? {
        val query = MatchesTable.selectAll().where { (MatchesTable.id eq matchId) and MatchesTable.deletedAt.isNull() }
        val row = (if (lock) query.forUpdate() else query).singleOrNull() ?: return null
        return FormationMatch(row[MatchesTable.id].value, row[MatchesTable.teamId], row[MatchesTable.matchType],
            row[MatchesTable.status], row[MatchesTable.sideAssignmentVersion])
    }

    fun role(teamId: Long, userId: Long, lock: Boolean): TeamMemberRole? {
        val team = TeamsTable.selectAll().where { TeamsTable.id eq teamId }
        val row = (if (lock) team.forUpdate() else team).singleOrNull() ?: return null
        if (row[TeamsTable.deletedAt] != null || row[TeamsTable.status] != TeamStatus.ACTIVE) return null
        val members = TeamMembersTable.selectAll().where {
            (TeamMembersTable.teamId eq teamId) and (TeamMembersTable.userId eq userId)
        }.orderBy(TeamMembersTable.id)
        return (if (lock) members.forUpdate() else members).firstOrNull {
            it[TeamMembersTable.deletedAt] == null && it[TeamMembersTable.status] == TeamMemberStatus.ACTIVE
        }?.get(TeamMembersTable.role)
    }

    fun players(match: FormationMatch, lock: Boolean): List<FormationPlayerState> {
        // Writes use current, locking reads. Historical membership status does not remove a player.
        val participantQuery = MatchParticipantsTable.selectAll().where { MatchParticipantsTable.matchId eq match.id }
            .orderBy(MatchParticipantsTable.id)
        val participants = (if (lock) participantQuery.forUpdate() else participantQuery).toList()
            .sortedWith(compareBy<ResultRow> { it[MatchParticipantsTable.deletedAt] != null }
                .thenByDescending { it[MatchParticipantsTable.id].value })
            .distinctBy { it[MatchParticipantsTable.teamMemberId] }
        val memberQuery = TeamMembersTable.selectAll().where { TeamMembersTable.teamId eq match.teamId }
            .orderBy(TeamMembersTable.id)
        val members = (if (lock) memberQuery.forUpdate() else memberQuery).associateBy { it[TeamMembersTable.id].value }
        return (members.keys + participants.map { it[MatchParticipantsTable.teamMemberId] }).map { id ->
            val member = members[id]
            val participant = participants.find { it[MatchParticipantsTable.teamMemberId] == id }
            val memberExists = member != null && member[TeamMembersTable.deletedAt] == null
            FormationPlayerState(id, if (memberExists) member[TeamMembersTable.displayName] else "삭제된 선수",
                memberExists, participant != null && participant[MatchParticipantsTable.deletedAt] == null,
                participant?.get(MatchParticipantsTable.voteStatus),
                if (match.type == MatchType.EXTERNAL) MatchTeamSide.HOME
                else participant?.get(MatchParticipantsTable.teamSide) ?: MatchTeamSide.UNASSIGNED,
                if (memberExists) member[TeamMembersTable.mainPosition] else null,
                if (memberExists) member[TeamMembersTable.jerseyNumber] else null)
        }
    }

    fun formations(matchId: Long): List<StoredFormation> {
        val rows = MatchFormationsTable.selectAll().where {
            (MatchFormationsTable.matchId eq matchId) and MatchFormationsTable.deletedAt.isNull()
        }.orderBy(MatchFormationsTable.createdAt to SortOrder.ASC, MatchFormationsTable.id to SortOrder.ASC).toList()
        if (rows.isEmpty()) return emptyList()
        val placements = MatchFormationPlacementsTable.selectAll().where {
            MatchFormationPlacementsTable.formationId inList rows.map { it[MatchFormationsTable.id].value }
        }.orderBy(MatchFormationPlacementsTable.id).groupBy { it[MatchFormationPlacementsTable.formationId] }
        return rows.map { row ->
            val id = row[MatchFormationsTable.id].value
            StoredFormation(id, matchId, row[MatchFormationsTable.title], row[MatchFormationsTable.side],
                row[MatchFormationsTable.templateId], row[MatchFormationsTable.version], row[MatchFormationsTable.createdAt],
                row[MatchFormationsTable.updatedAt], placements[id].orEmpty().map {
                    FormationPlacementRequest(it[MatchFormationPlacementsTable.slotId], it[MatchFormationPlacementsTable.teamMemberId])
                })
        }
    }

    fun save(matchId: Long, userId: Long, request: MatchFormationRequest, existing: StoredFormation?): Long {
        val now = LocalDateTime.now()
        val id = if (existing == null) MatchFormationsTable.insertAndGetId {
            it[this.matchId] = matchId
            it[title] = request.title.trim()
            it[side] = MatchTeamSide.valueOf(request.side)
            it[templateId] = request.templateId
            it[version] = 1
            it[createdByUserId] = userId
            it[updatedByUserId] = userId
            it[createdAt] = now
            it[updatedAt] = now
        }.value else {
            MatchFormationsTable.update({ MatchFormationsTable.id eq existing.id }) {
                it[title] = request.title.trim()
                it[side] = MatchTeamSide.valueOf(request.side)
                it[templateId] = request.templateId
                it[version] = existing.version + 1
                it[updatedByUserId] = userId
                it[updatedAt] = now
            }
            MatchFormationPlacementsTable.deleteWhere { formationId eq existing.id }
            existing.id
        }
        request.placements.forEach { placement ->
            MatchFormationPlacementsTable.insert {
                it[formationId] = id
                it[slotId] = placement.slotId
                it[teamMemberId] = placement.teamMemberId
            }
        }
        return id
    }

    fun delete(formation: StoredFormation, userId: Long) {
        MatchFormationsTable.update({ MatchFormationsTable.id eq formation.id }) {
            it[deletedAt] = LocalDateTime.now()
            it[updatedAt] = LocalDateTime.now()
            it[updatedByUserId] = userId
            it[version] = formation.version + 1
        }
    }

    fun assignSides(match: FormationMatch, assignments: List<SideAssignmentRequest>) {
        assignments.sortedBy { it.teamMemberId }.forEach { assignment ->
            MatchParticipantsTable.update({ (MatchParticipantsTable.matchId eq match.id) and
                (MatchParticipantsTable.teamMemberId eq assignment.teamMemberId) and MatchParticipantsTable.deletedAt.isNull() }) {
                it[teamSide] = MatchTeamSide.valueOf(assignment.side)
                it[updatedAt] = LocalDateTime.now()
            }
        }
        MatchesTable.update({ MatchesTable.id eq match.id }) {
            it[sideAssignmentVersion] = match.sideVersion + 1
        }
    }
}
