package com.yonghoo.team_manager.team.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamSeasonRecord
import com.yonghoo.team_manager.team.dto.TeamSeasonCreateRequest
import com.yonghoo.team_manager.team.dto.TeamSeasonOrderUpdateRequest
import com.yonghoo.team_manager.team.dto.TeamSeasonResponse
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.team.repository.TeamSeasonRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class TeamSeasonService(
    private val teamRepository: TeamRepository,
    private val teamSeasonRepository: TeamSeasonRepository,
) {
    @Transactional(readOnly = true)
    fun getSeasons(teamId: Long, userId: Long): List<TeamSeasonResponse> {
        requireMember(teamId, userId)
        return orderedSeasons(teamId).map(TeamSeasonResponse::from)
    }

    fun createSeason(teamId: Long, userId: Long, request: TeamSeasonCreateRequest): List<TeamSeasonResponse> {
        requireManager(teamId, userId)
        val name = request.name.trim()
        if (name.isBlank() || name.length > 50 || request.startDate.isAfter(request.endDate)) {
            throw ApiException(TeamErrorCode.INVALID_TEAM_SEASON_REQUEST)
        }

        val seasons = teamSeasonRepository.selectByTeamId(teamId)
        if (seasons.any { it.name.equals(name, ignoreCase = true) }) {
            throw ApiException(TeamErrorCode.DUPLICATE_TEAM_SEASON_NAME)
        }

        teamSeasonRepository.create(
            teamId = teamId,
            userId = userId,
            name = name,
            startDate = request.startDate,
            endDate = request.endDate,
            isDefault = seasons.isEmpty(),
            sortOrder = (seasons.maxOfOrNull(TeamSeasonRecord::sortOrder) ?: -1) + 1,
        )
        return orderedSeasons(teamId).map(TeamSeasonResponse::from)
    }

    fun setDefault(teamId: Long, seasonId: Long, userId: Long): List<TeamSeasonResponse> {
        requireManager(teamId, userId)
        val season = teamSeasonRepository.selectById(teamId, seasonId)
            ?: throw ApiException(TeamErrorCode.TEAM_SEASON_NOT_FOUND)
        teamSeasonRepository.clearDefault(teamId)
        teamSeasonRepository.setDefault(season.id)
        return orderedSeasons(teamId).map(TeamSeasonResponse::from)
    }

    fun updateOrder(
        teamId: Long,
        userId: Long,
        request: TeamSeasonOrderUpdateRequest,
    ): List<TeamSeasonResponse> {
        requireManager(teamId, userId)
        val currentIds = teamSeasonRepository.selectByTeamId(teamId).map(TeamSeasonRecord::id)
        if (request.seasonIds.size != request.seasonIds.distinct().size ||
            request.seasonIds.size != currentIds.size ||
            request.seasonIds.toSet() != currentIds.toSet()
        ) {
            throw ApiException(TeamErrorCode.INVALID_TEAM_SEASON_ORDER)
        }
        teamSeasonRepository.updateSortOrders(request.seasonIds)
        return orderedSeasons(teamId).map(TeamSeasonResponse::from)
    }

    private fun orderedSeasons(teamId: Long) = teamSeasonRepository.selectByTeamId(teamId).sortedWith(
        compareByDescending<TeamSeasonRecord> { it.isDefault }
            .thenBy(TeamSeasonRecord::sortOrder)
            .thenBy(TeamSeasonRecord::id),
    )

    private fun requireMember(teamId: Long, userId: Long) {
        if (teamRepository.selectTeamById(teamId) == null) throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        if (!teamRepository.existsActiveMember(teamId, userId)) {
            throw ApiException(TeamErrorCode.TEAM_MEMBER_VIEW_FORBIDDEN)
        }
    }

    private fun requireManager(teamId: Long, userId: Long) {
        if (teamRepository.selectTeamById(teamId) == null) throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        val role = teamRepository.selectActiveMemberRole(teamId, userId)
        if (role != TeamMemberRole.OWNER && role != TeamMemberRole.SUB_MANAGER) {
            throw ApiException(TeamErrorCode.TEAM_SEASON_MANAGEMENT_FORBIDDEN)
        }
    }
}
