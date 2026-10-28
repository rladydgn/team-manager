package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.dto.CommonErrorCode
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.match.exception.FormationErrorCode.*
import com.yonghoo.team_manager.match.repository.*
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Isolation
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(isolation = Isolation.REPEATABLE_READ)
class MatchFormationService(private val repository: MatchFormationRepository) {
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    fun list(matchId: Long, userId: Long): FormationCollection {
        val (match, manager) = access(matchId, userId)
        val formations = repository.formations(match.id)
        val players = repository.players(match, false)
        val editable = manager && match.status != MatchStatus.CANCELED
        return FormationCollection(match.id, match.type, match.status, 10,
            FormationPermissions(editable && formations.size < 10, editable, manager, editable && match.type == MatchType.INTERNAL && !match.recordSaved),
            FormationTemplates.all, attending(players), formations.map { response(it, players) })
    }

    fun save(matchId: Long, userId: Long, request: MatchFormationRequest, formationId: Long? = null): MatchFormationResponse {
        val (match) = access(matchId, userId, write = true)
        val formations = repository.formations(match.id)
        val existing = formationId?.let { id -> formations.find { it.id == id } ?: missing() }
        if (existing != null) checkVersion(request.version, existing.version)
        if (match.status == MatchStatus.CANCELED) throw ApiException(MATCH_FORMATION_MATCH_CANCELED)
        if (existing == null && formations.size >= 10) throw ApiException(MATCH_FORMATION_LIMIT_REACHED)
        validate(request, match)
        val players = repository.players(match, true)
        val byId = players.associateBy { it.teamMemberId }
        if (request.placements.any { reason(byId[it.teamMemberId], MatchTeamSide.valueOf(request.side)) != null }) {
            throw ApiException(MATCH_FORMATION_PLAYER_INELIGIBLE)
        }
        val id = repository.save(match.id, userId, request, existing)
        return response(repository.formations(match.id).first { it.id == id }, players)
    }

    fun delete(matchId: Long, formationId: Long, userId: Long, version: Long): Map<String, Long> {
        val (match) = access(matchId, userId, write = true)
        val formation = repository.formations(match.id).find { it.id == formationId } ?: missing()
        checkVersion(version, formation.version)
        repository.delete(formation, userId)
        return mapOf("id" to formation.id)
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    fun sides(matchId: Long, userId: Long): ParticipantSidesResponse {
        val (match, manager) = access(matchId, userId, internal = true)
        return ParticipantSidesResponse(match.id, match.sideVersion, manager && match.status != MatchStatus.CANCELED && !match.recordSaved,
            attending(repository.players(match, false)), recordEditingRequired = match.recordSaved)
    }

    fun assignSides(matchId: Long, userId: Long, request: ParticipantSidesRequest): ParticipantSidesResponse {
        val (match) = access(matchId, userId, write = true, internal = true)
        if (!validId(request.version)) throw ApiException(INVALID_MATCH_SIDE_ASSIGNMENT_REQUEST)
        if (request.version != match.sideVersion) throw ApiException(MATCH_SIDE_ASSIGNMENT_VERSION_CONFLICT)
        if (match.status == MatchStatus.CANCELED) throw ApiException(MATCH_SIDE_ASSIGNMENT_MATCH_CANCELED)
        if (match.recordSaved) throw ApiException(MATCH_SIDE_ASSIGNMENT_RECORD_EDIT_REQUIRED)
        val players = repository.players(match, true)
        val eligible = attending(players).map { it.teamMemberId }.toSet()
        if (request.assignments.isEmpty() || request.assignments.map { it.teamMemberId }.distinct().size != request.assignments.size ||
            request.assignments.any { !validId(it.teamMemberId) || it.teamMemberId !in eligible || it.side !in MatchTeamSide.entries.map { side -> side.name } }) {
            throw ApiException(INVALID_MATCH_SIDE_ASSIGNMENT_REQUEST)
        }
        repository.assignSides(match, request.assignments)
        return ParticipantSidesResponse(match.id, match.sideVersion + 1, true, attending(repository.players(match, true)))
    }

    private fun access(matchId: Long, userId: Long, write: Boolean = false, internal: Boolean = false): Pair<FormationMatch, Boolean> {
        val match = repository.match(matchId, write) ?: missing()
        val role = repository.role(match.teamId, userId, write) ?: missing()
        val manager = role == TeamMemberRole.OWNER || role == TeamMemberRole.SUB_MANAGER
        if ((write && !manager) || (internal && match.type != MatchType.INTERNAL)) missing()
        return match to manager
    }

    private fun checkVersion(version: Long?, current: Long) {
        if (version == null || !validId(version)) throw ApiException(INVALID_MATCH_FORMATION_REQUEST)
        if (version != current) throw ApiException(MATCH_FORMATION_VERSION_CONFLICT)
    }

    private fun validate(request: MatchFormationRequest, match: FormationMatch) {
        val template = FormationTemplates.all.find { it.id == request.templateId }
        val title = request.title.trim()
        if (title.length !in 1..50 || request.title.any { it == '\n' || it == '\r' || it == '\u2028' || it == '\u2029' } ||
            request.side !in listOf("HOME", "AWAY") || (match.type == MatchType.EXTERNAL && request.side != "HOME") ||
            template == null || request.placements.size > 11 ||
            request.placements.map { it.slotId }.distinct().size != request.placements.size ||
            request.placements.map { it.teamMemberId }.distinct().size != request.placements.size ||
            request.placements.any { !validId(it.teamMemberId) || it.slotId !in template.slots.map(FormationSlot::id) }) {
            throw ApiException(INVALID_MATCH_FORMATION_REQUEST)
        }
    }

    private fun attending(players: List<FormationPlayerState>) = players.filter {
        it.memberExists && it.participantExists && it.vote == MatchParticipantStatus.AVAILABLE
    }.map { FormationPlayer(it.teamMemberId, it.name, it.side, it.mainPosition, it.jerseyNumber) }
        .sortedWith(compareBy<FormationPlayer> { it.name }.thenBy { it.teamMemberId })

    private fun reason(player: FormationPlayerState?, side: MatchTeamSide): String? = when {
        player == null || !player.memberExists -> "MEMBER_REMOVED"
        !player.participantExists -> "PARTICIPANT_REMOVED"
        player.vote != MatchParticipantStatus.AVAILABLE -> "NOT_ATTENDING"
        player.side == MatchTeamSide.UNASSIGNED -> "SIDE_UNASSIGNED"
        player.side != side -> "SIDE_MISMATCH"
        else -> null
    }

    private fun response(formation: StoredFormation, players: List<FormationPlayerState>): MatchFormationResponse {
        val byId = players.associateBy { it.teamMemberId }
        return MatchFormationResponse(formation.id, formation.matchId, formation.title, formation.side, formation.templateId,
            formation.placements.map {
                val player = byId[it.teamMemberId]
                val reason = reason(player, formation.side)
                FormationPlacement(it.slotId, it.teamMemberId, player?.name ?: "삭제된 선수", reason == null, reason,
                    player?.mainPosition, player?.jerseyNumber)
            }, formation.version, formation.createdAt, formation.updatedAt)
    }

    private fun validId(value: Long) = value in 1..9_007_199_254_740_991L
    private fun missing(): Nothing = throw ApiException(CommonErrorCode.RESOURCE_NOT_FOUND)
}
