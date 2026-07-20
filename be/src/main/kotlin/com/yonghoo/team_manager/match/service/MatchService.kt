package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.MatchType
import com.yonghoo.team_manager.match.dto.MatchCreateRequest
import com.yonghoo.team_manager.match.dto.MatchParticipantResponse
import com.yonghoo.team_manager.match.dto.MatchParticipationUpdateRequest
import com.yonghoo.team_manager.match.dto.MatchResponse
import com.yonghoo.team_manager.match.exception.MatchErrorCode
import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchRecord
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.TeamRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Transactional
@Service
class MatchService(
    private val matchParticipantRepository: MatchParticipantRepository,
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
        val match = getMatchAndValidateViewPermission(matchId, userId)
        val teamMember = requireActiveTeamMember(match.teamId, userId)
        val participants = matchParticipantRepository.selectParticipantsByMatchIds(listOf(match.id))

        return toMatchResponse(match, teamMember.id, participants)
    }

    @Transactional(readOnly = true)
    fun getMatches(
        teamId: Long,
        userId: Long,
    ): List<MatchResponse> {
        validateTeamExists(teamId)
        val teamMember = requireActiveTeamMember(teamId, userId)
        val matches = matchRepository.selectMatchesByTeamId(teamId)
        val participantsByMatchId = matchParticipantRepository
            .selectParticipantsByMatchIds(matches.map(MatchRecord::id))
            .groupBy { it.matchId }

        return matches.map { match ->
            toMatchResponse(match, teamMember.id, participantsByMatchId[match.id].orEmpty())
        }
    }

    @Transactional(readOnly = true)
    fun getMatchParticipants(
        matchId: Long,
        userId: Long,
    ): List<MatchParticipantResponse> {
        val match = getMatchAndValidateViewPermission(matchId, userId)
        val participantByMemberId = matchParticipantRepository
            .selectParticipantsByMatchIds(listOf(match.id))
            .associateBy { it.teamMemberId }

        return teamRepository.selectMembersByTeamId(match.teamId).map { member ->
            val participant = participantByMemberId[member.id]

            MatchParticipantResponse(
                teamMemberId = member.id,
                status = participant?.status ?: MatchParticipantStatus.PENDING,
                memo = participant?.memo,
                respondedAt = participant?.respondedAt,
            )
        }
    }

    fun updateMatchParticipation(
        matchId: Long,
        userId: Long,
        request: MatchParticipationUpdateRequest,
    ): MatchParticipantResponse {
        if (request.status !in setOf(MatchParticipantStatus.AVAILABLE, MatchParticipantStatus.UNAVAILABLE)) {
            throw ApiException(MatchErrorCode.INVALID_MATCH_PARTICIPATION_REQUEST)
        }
        val memo = request.memo?.let(::normalizeParticipationMemo)

        val match = getMatchAndValidateViewPermission(matchId, userId)
        validateParticipationDeadline(match)
        val teamMember = requireActiveTeamMember(match.teamId, userId)
        val participant = matchParticipantRepository.upsertParticipation(
            matchId = match.id,
            teamMemberId = teamMember.id,
            status = request.status,
            memo = memo,
            shouldUpdateMemo = request.memo != null,
        )

        return MatchParticipantResponse(
            teamMemberId = participant.teamMemberId,
            status = participant.status,
            memo = participant.memo,
            respondedAt = participant.respondedAt,
        )
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

    private fun getMatchAndValidateViewPermission(
        matchId: Long,
        userId: Long,
    ): MatchRecord {
        val match = matchRepository.selectMatchById(matchId)
            ?: throw ApiException(MatchErrorCode.MATCH_NOT_FOUND)
        validateMatchViewPermission(match.teamId, userId)
        return match
    }

    private fun requireActiveTeamMember(
        teamId: Long,
        userId: Long,
    ) = teamRepository.selectActiveTeamMemberByTeamAndUser(teamId, userId)
        ?: throw ApiException(MatchErrorCode.MATCH_VIEW_FORBIDDEN)

    private fun validateParticipationDeadline(match: MatchRecord) {
        if (match.status != com.yonghoo.team_manager.match.domain.MatchStatus.SCHEDULED ||
            !match.matchAt.isAfter(java.time.LocalDateTime.now().plusHours(PARTICIPATION_CUTOFF_HOURS))
        ) {
            throw ApiException(MatchErrorCode.MATCH_PARTICIPATION_CLOSED)
        }
    }

    private fun normalizeParticipationMemo(memo: String): String? {
        val normalizedMemo = memo.trim().takeIf(String::isNotBlank)

        if (normalizedMemo?.length?.let { it > PARTICIPATION_MEMO_MAX_LENGTH } == true) {
            throw ApiException(MatchErrorCode.MATCH_PARTICIPATION_MEMO_TOO_LONG)
        }

        return normalizedMemo
    }

    private fun toMatchResponse(
        match: MatchRecord,
        teamMemberId: Long,
        participants: List<com.yonghoo.team_manager.match.domain.MatchParticipantRecord>,
    ): MatchResponse {
        return MatchResponse.from(
            match = match,
            availableParticipantCount = participants.count { it.status == MatchParticipantStatus.AVAILABLE },
            myParticipationStatus = participants
                .firstOrNull { it.teamMemberId == teamMemberId }
                ?.status
                ?: MatchParticipantStatus.PENDING,
        )
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
        private const val PARTICIPATION_CUTOFF_HOURS = 24L
        private const val PARTICIPATION_MEMO_MAX_LENGTH = 500
    }
}
