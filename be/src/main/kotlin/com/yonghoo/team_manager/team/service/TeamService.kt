package com.yonghoo.team_manager.team.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.domain.TeamHistoryAction
import com.yonghoo.team_manager.team.domain.TeamHistorySnapshot
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamRecord
import com.yonghoo.team_manager.team.dto.TeamCreateRequest
import com.yonghoo.team_manager.team.dto.TeamDetailResponse
import com.yonghoo.team_manager.team.dto.TeamMemberResponse
import com.yonghoo.team_manager.team.dto.TeamResponse
import com.yonghoo.team_manager.team.dto.TeamUpdateRequest
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Transactional
@Service
class TeamService(
    private val teamRepository: TeamRepository,
    private val userRepository: UserRepository,
    private val objectMapper: ObjectMapper,
) {
    fun createTeam(
        createdByUserId: Long,
        request: TeamCreateRequest,
    ): TeamResponse {
        validateTeamCreateRequest(request)
        validateUserExists(createdByUserId)

        val team = teamRepository.createTeam(createdByUserId, request)
        teamRepository.createTeamMember(
            teamId = team.id,
            userId = createdByUserId,
            role = TeamMemberRole.OWNER,
        )

        return TeamResponse.from(team)
    }

    fun updateTeam(
        teamId: Long,
        userId: Long,
        request: TeamUpdateRequest,
    ): TeamResponse {
        validateTeamUpdateRequest(request)

        val team = teamRepository.selectTeamById(teamId)
            ?: throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        validateTeamUpdatePermission(teamId, userId)

        val beforeSnapshot = serializeHistorySnapshot(team)
        val updatedTeam = teamRepository.updateTeam(teamId, request)

        teamRepository.createTeamHistory(
            teamId = teamId,
            action = TeamHistoryAction.UPDATE,
            changedByUserId = userId,
            beforeSnapshot = beforeSnapshot,
            afterSnapshot = serializeHistorySnapshot(updatedTeam),
        )

        return TeamResponse.from(updatedTeam)
    }

    fun deleteTeam(
        teamId: Long,
        userId: Long,
    ) {
        val team = teamRepository.selectTeamById(teamId)
            ?: throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)

        validateTeamDeletePermission(teamId, userId)
        validateOnlyActiveMember(teamId, userId)

        teamRepository.softDeleteTeam(teamId)
        teamRepository.createTeamHistory(
            teamId = teamId,
            action = TeamHistoryAction.DELETE,
            changedByUserId = userId,
            beforeSnapshot = serializeHistorySnapshot(team),
            afterSnapshot = null,
        )
    }

    fun joinTeam(
        teamId: Long,
        userId: Long,
    ): TeamMemberResponse {
        val user = getUser(userId)
        validateTeamExists(teamId)

        if (teamRepository.existsActiveMember(teamId, userId)) {
            throw ApiException(TeamErrorCode.ALREADY_JOINED_TEAM)
        }

        return TeamMemberResponse.from(
            teamRepository.createTeamMember(
                teamId = teamId,
                userId = userId,
                role = TeamMemberRole.MEMBER,
            ),
            name = user.name,
        )
    }

    @Transactional(readOnly = true)
    fun getTeams(): List<TeamResponse> {
        return teamRepository.selectTeams().map(TeamResponse::from)
    }

    @Transactional(readOnly = true)
    fun getTeam(teamId: Long): TeamDetailResponse {
        val team = teamRepository.selectTeamById(teamId)
            ?: throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        val members = teamRepository.selectMembersByTeamId(teamId).map { member ->
            TeamMemberResponse.from(
                member = member,
                name = member.userId
                    ?.let(userRepository::selectUserById)
                    ?.name,
            )
        }

        return TeamDetailResponse(
            team = TeamResponse.from(team),
            members = members,
        )
    }

    private fun validateTeamCreateRequest(request: TeamCreateRequest) {
        validateTeamName(request.name)
    }

    private fun validateTeamUpdateRequest(request: TeamUpdateRequest) {
        validateTeamName(request.name)

        if (isLongerThan(request.shortName, SHORT_NAME_MAX_LENGTH) ||
            isLongerThan(request.logoUrl, LOGO_URL_MAX_LENGTH) ||
            isLongerThan(request.region, REGION_MAX_LENGTH) ||
            isLongerThan(request.homeStadium, HOME_STADIUM_MAX_LENGTH) ||
            isLongerThan(request.teamColor, TEAM_COLOR_MAX_LENGTH)
        ) {
            throw ApiException(TeamErrorCode.INVALID_TEAM_REQUEST)
        }
    }

    private fun validateTeamName(name: String) {
        val normalizedName = name.trim()

        if (normalizedName.isBlank() || normalizedName.length > TEAM_NAME_MAX_LENGTH) {
            throw ApiException(TeamErrorCode.INVALID_TEAM_REQUEST)
        }
    }

    private fun validateTeamUpdatePermission(
        teamId: Long,
        userId: Long,
    ) {
        val role = teamRepository.selectActiveMemberRole(teamId, userId)

        if (role != TeamMemberRole.OWNER && role != TeamMemberRole.SUB_MANAGER) {
            throw ApiException(TeamErrorCode.TEAM_UPDATE_FORBIDDEN)
        }
    }

    private fun validateTeamDeletePermission(
        teamId: Long,
        userId: Long,
    ) {
        if (teamRepository.selectActiveMemberRole(teamId, userId) != TeamMemberRole.OWNER) {
            throw ApiException(TeamErrorCode.TEAM_DELETE_FORBIDDEN)
        }
    }

    private fun validateOnlyActiveMember(
        teamId: Long,
        userId: Long,
    ) {
        val activeMembers = teamRepository.selectMembersByTeamId(teamId)

        if (activeMembers.size != 1 || activeMembers.single().userId != userId) {
            throw ApiException(TeamErrorCode.TEAM_DELETE_REQUIRES_SOLE_MEMBER)
        }
    }

    private fun serializeHistorySnapshot(team: TeamRecord): String {
        return objectMapper.writeValueAsString(TeamHistorySnapshot.from(team))
    }

    private fun isLongerThan(value: String?, maxLength: Int): Boolean {
        return value?.length?.let { it > maxLength } ?: false
    }

    private fun validateUserExists(userId: Long) {
        getUser(userId)
    }

    private fun getUser(userId: Long) = userRepository.selectUserById(userId)
        ?: throw ApiException(TeamErrorCode.USER_NOT_FOUND)

    private fun validateTeamExists(teamId: Long) {
        if (teamRepository.selectTeamById(teamId) == null) {
            throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        }
    }

    companion object {
        private const val TEAM_NAME_MAX_LENGTH = 100
        private const val SHORT_NAME_MAX_LENGTH = 30
        private const val LOGO_URL_MAX_LENGTH = 500
        private const val REGION_MAX_LENGTH = 100
        private const val HOME_STADIUM_MAX_LENGTH = 100
        private const val TEAM_COLOR_MAX_LENGTH = 20
    }
}
