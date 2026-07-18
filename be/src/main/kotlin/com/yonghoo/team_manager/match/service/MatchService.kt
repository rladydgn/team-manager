package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.MatchType
import com.yonghoo.team_manager.match.dto.MatchCreateRequest
import com.yonghoo.team_manager.match.dto.MatchResponse
import com.yonghoo.team_manager.match.exception.MatchErrorCode
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.TeamRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Transactional
@Service
class MatchService(
    private val matchRepository: MatchRepository,
    private val teamRepository: TeamRepository,
) {
    fun createMatch(
        createdByUserId: Long,
        request: MatchCreateRequest,
    ): MatchResponse {
        validateTeamExists(request.teamId)
        validateMatchManager(request.teamId, createdByUserId)
        val opponentTeamName = validateMatchRequest(request)

        return MatchResponse.from(
            matchRepository.createMatch(
                createdByUserId = createdByUserId,
                request = request,
                opponentTeamName = opponentTeamName,
            ),
        )
    }

    @Transactional(readOnly = true)
    fun getMatch(
        matchId: Long,
        userId: Long,
    ): MatchResponse {
        val match = matchRepository.selectMatchById(matchId)
            ?: throw ApiException(MatchErrorCode.MATCH_NOT_FOUND)
        validateMatchViewPermission(match.teamId, userId)

        return MatchResponse.from(match)
    }

    @Transactional(readOnly = true)
    fun getMatches(
        teamId: Long,
        userId: Long,
    ): List<MatchResponse> {
        validateTeamExists(teamId)
        validateMatchViewPermission(teamId, userId)
        return matchRepository.selectMatchesByTeamId(teamId).map(MatchResponse::from)
    }

    private fun validateTeamExists(teamId: Long) {
        if (teamRepository.selectTeamById(teamId) == null) {
            throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        }
    }

    private fun validateMatchManager(
        teamId: Long,
        userId: Long,
    ) {
        val role = teamRepository.selectActiveMemberRole(teamId, userId)

        if (role != TeamMemberRole.OWNER && role != TeamMemberRole.SUB_MANAGER) {
            throw ApiException(MatchErrorCode.MATCH_CREATION_FORBIDDEN)
        }
    }

    private fun validateMatchViewPermission(
        teamId: Long,
        userId: Long,
    ) {
        if (!teamRepository.existsActiveMember(teamId, userId)) {
            throw ApiException(MatchErrorCode.MATCH_VIEW_FORBIDDEN)
        }
    }

    private fun validateMatchRequest(request: MatchCreateRequest): String? {
        val opponentTeamName = request.opponentTeamName?.trim()?.takeIf(String::isNotBlank)

        when (request.matchType) {
            MatchType.EXTERNAL -> {
                if ((request.opponentTeamId == null && opponentTeamName == null) ||
                    (request.opponentTeamId != null && opponentTeamName != null) ||
                    opponentTeamName?.length?.let { it > OPPONENT_TEAM_NAME_MAX_LENGTH } == true
                ) {
                    throw ApiException(MatchErrorCode.INVALID_MATCH_REQUEST)
                }

                if (request.opponentTeamId != null && teamRepository.selectTeamById(request.opponentTeamId) == null) {
                    throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
                }
            }

            MatchType.INTERNAL -> {
                if (request.opponentTeamId != null || opponentTeamName != null) {
                    throw ApiException(MatchErrorCode.INVALID_MATCH_REQUEST)
                }
            }
        }

        if (request.location?.trim()?.length?.let { it > LOCATION_MAX_LENGTH } == true) {
            throw ApiException(MatchErrorCode.INVALID_MATCH_REQUEST)
        }

        return opponentTeamName
    }

    companion object {
        private const val OPPONENT_TEAM_NAME_MAX_LENGTH = 100
        private const val LOCATION_MAX_LENGTH = 255
    }
}
