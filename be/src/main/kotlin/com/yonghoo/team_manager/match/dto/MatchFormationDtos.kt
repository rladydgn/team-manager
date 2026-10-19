package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchStatus
import com.yonghoo.team_manager.match.domain.MatchTeamSide
import com.yonghoo.team_manager.match.domain.MatchType
import java.time.LocalDateTime
import tools.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.annotation.JsonSetter
import com.fasterxml.jackson.annotation.Nulls
import com.yonghoo.team_manager.team.domain.PlayerPosition

data class FormationPlacementRequest(
    @field:JsonDeserialize(using = FormationStringDeserializer::class) val slotId: String,
    @field:JsonDeserialize(using = FormationLongDeserializer::class) val teamMemberId: Long,
)
data class MatchFormationRequest(
    @field:JsonDeserialize(using = FormationStringDeserializer::class)
    val title: String,
    @field:JsonDeserialize(using = FormationStringDeserializer::class)
    val side: String,
    @field:JsonDeserialize(using = FormationStringDeserializer::class)
    val templateId: String,
    @field:JsonSetter(nulls = Nulls.FAIL, contentNulls = Nulls.FAIL)
    val placements: List<FormationPlacementRequest>,
    @field:JsonDeserialize(using = FormationLongDeserializer::class)
    val version: Long? = null,
)
data class SideAssignmentRequest(
    @field:JsonDeserialize(using = FormationLongDeserializer::class) val teamMemberId: Long,
    @field:JsonDeserialize(using = FormationStringDeserializer::class) val side: String,
)
data class ParticipantSidesRequest(
    @field:JsonDeserialize(using = FormationLongDeserializer::class) val version: Long,
    @field:JsonSetter(nulls = Nulls.FAIL, contentNulls = Nulls.FAIL)
    val assignments: List<SideAssignmentRequest>,
)
data class FormationSlot(val id: String, val label: String, val x: Double, val y: Double)
data class FormationTemplate(val id: String, val label: String, val slots: List<FormationSlot>)
data class FormationPlayer(
    val teamMemberId: Long, val name: String, val side: MatchTeamSide,
    val mainPosition: PlayerPosition? = null, val jerseyNumber: Int? = null,
)
data class FormationPlacement(
    val slotId: String,
    val teamMemberId: Long,
    val name: String,
    val eligible: Boolean,
    val ineligibleReason: String?,
    val mainPosition: PlayerPosition? = null,
    val jerseyNumber: Int? = null,
)
data class MatchFormationResponse(
    val id: Long,
    val matchId: Long,
    val title: String,
    val side: MatchTeamSide,
    val templateId: String,
    val placements: List<FormationPlacement>,
    val version: Long,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)
data class FormationPermissions(
    val canCreate: Boolean, val canUpdate: Boolean, val canDelete: Boolean, val canAssignSides: Boolean,
)
data class FormationCollection(
    val matchId: Long,
    val matchType: MatchType,
    val matchStatus: MatchStatus,
    val maxFormations: Int,
    val permissions: FormationPermissions,
    val templates: List<FormationTemplate>,
    val attendingPlayers: List<FormationPlayer>,
    val formations: List<MatchFormationResponse>,
)
data class ParticipantSidesResponse(
    val matchId: Long, val version: Long, val canManage: Boolean, val players: List<FormationPlayer>,
)
