package com.yonghoo.team_manager.team.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.dto.TeamCreateRequest
import com.yonghoo.team_manager.team.dto.TeamDetailResponse
import com.yonghoo.team_manager.team.dto.TeamJoinRequest
import com.yonghoo.team_manager.team.dto.TeamMemberResponse
import com.yonghoo.team_manager.team.dto.TeamResponse
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
) {
    fun createTeam(request: TeamCreateRequest): TeamResponse {
        validateTeamCreateRequest(request)
        validateUserExists(request.createdByUserId)

        val team = teamRepository.createTeam(request)
        teamRepository.createTeamMember(
            teamId = team.id,
            userId = request.createdByUserId,
            role = TeamMemberRole.OWNER,
        )

        return TeamResponse.from(team)
    }

    fun joinTeam(
        teamId: Long,
        request: TeamJoinRequest,
    ): TeamMemberResponse {
        validateUserExists(request.userId)
        validateTeamExists(teamId)

        if (teamRepository.existsActiveMember(teamId, request.userId)) {
            throw ApiException(TeamErrorCode.ALREADY_JOINED_TEAM)
        }

        return TeamMemberResponse.from(
            teamRepository.createTeamMember(
                teamId = teamId,
                userId = request.userId,
                role = TeamMemberRole.MEMBER,
            ),
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
        val members = teamRepository.selectMembersByTeamId(teamId).map(TeamMemberResponse::from)

        return TeamDetailResponse(
            team = TeamResponse.from(team),
            members = members,
        )
    }

    private fun validateTeamCreateRequest(request: TeamCreateRequest) {
        if (request.name.isBlank() || request.name.length > 100) {
            throw ApiException(TeamErrorCode.INVALID_TEAM_REQUEST)
        }
    }

    private fun validateUserExists(userId: Long) {
        if (!userRepository.existsById(userId)) {
            throw ApiException(TeamErrorCode.USER_NOT_FOUND)
        }
    }

    private fun validateTeamExists(teamId: Long) {
        if (teamRepository.selectTeamById(teamId) == null) {
            throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        }
    }
}
