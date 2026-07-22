package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.MatchParticipantRecord
import com.yonghoo.team_manager.match.domain.MatchStatus
import com.yonghoo.team_manager.match.domain.MatchType
import com.yonghoo.team_manager.match.dto.MatchCreateRequest
import com.yonghoo.team_manager.match.dto.MatchParticipantResponse
import com.yonghoo.team_manager.match.dto.MatchParticipantStatisticsUpdateRequest
import com.yonghoo.team_manager.match.dto.MatchParticipationUpdateRequest
import com.yonghoo.team_manager.match.dto.MatchRecordUpdateRequest
import com.yonghoo.team_manager.match.dto.MatchResponse
import com.yonghoo.team_manager.match.dto.TeamAttendanceMemberResponse
import com.yonghoo.team_manager.match.dto.TeamAttendanceStatisticsResponse
import com.yonghoo.team_manager.match.exception.MatchErrorCode
import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchRecord
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import kotlin.math.round

@Transactional
@Service
class MatchService(
    private val matchParticipantRepository: MatchParticipantRepository,
    private val matchRepository: MatchRepository,
    private val teamRepository: TeamRepository,
    private val userRepository: UserRepository,
) {
    fun createMatch(
        createdByUserId: Long,
        request: MatchCreateRequest,
    ): MatchResponse {
        validateTeamExists(request.teamId)
        validateMatchManager(request.teamId, createdByUserId)
        val opponentTeamName = validateMatchRequest(request)

        val match = matchRepository.createMatch(
            createdByUserId = createdByUserId,
            request = request,
            opponentTeamName = opponentTeamName,
        )
        val participants = matchParticipantRepository.createDefaultParticipants(
            matchId = match.id,
            teamMemberIds = teamRepository.selectMembersByTeamId(match.teamId).map { it.id },
        )
        val currentTeamMember = requireActiveTeamMember(match.teamId, createdByUserId)

        return toMatchResponse(match, currentTeamMember.id, participants)
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
        val participants = matchParticipantRepository
            .selectParticipantsByMatchIds(listOf(match.id))
            .sortedBy { it.teamMemberId }

        return participants.map { participant ->
            MatchParticipantResponse(
                teamMemberId = participant.teamMemberId,
                status = participant.status,
                goalCount = participant.goalCount,
                assistCount = participant.assistCount,
                cleanSheetCount = participant.cleanSheetCount,
                memo = participant.memo,
                respondedAt = participant.respondedAt,
            )
        }
    }

    @Transactional(readOnly = true)
    fun getAttendanceStatistics(
        teamId: Long,
        userId: Long,
        startDate: LocalDate,
        endDate: LocalDate,
        page: Int,
    ): TeamAttendanceStatisticsResponse {
        if (startDate.isAfter(endDate) || page < 0) {
            throw ApiException(MatchErrorCode.INVALID_MATCH_STATISTICS_REQUEST)
        }

        validateTeamExists(teamId)
        requireActiveTeamMember(teamId, userId)

        val startAt = startDate.atStartOfDay()
        val endAtExclusive = endDate.plusDays(1).atStartOfDay()
        val matches = matchRepository.selectMatchesByTeamId(teamId).filter { match ->
            match.status != com.yonghoo.team_manager.match.domain.MatchStatus.CANCELED &&
                !match.matchAt.isBefore(startAt) &&
                match.matchAt.isBefore(endAtExclusive)
        }
        val attendanceCountByMemberId = matchParticipantRepository
            .selectParticipantsByMatchIds(matches.map(MatchRecord::id))
            .asSequence()
            .filter { it.status == MatchParticipantStatus.AVAILABLE }
            .groupingBy { it.teamMemberId }
            .eachCount()
        val members = teamRepository.selectMembersByTeamId(teamId)
        val namesByUserId = userRepository
            .selectUsersByIds(members.mapNotNull { it.userId })
            .associateBy({ it.id }, { it.name })
        val memberStatistics = members
            .map { member ->
                val attendanceCount = attendanceCountByMemberId[member.id] ?: 0

                TeamAttendanceMemberResponse(
                    teamMemberId = member.id,
                    name = member.userId?.let(namesByUserId::get) ?: "미가입 팀원",
                    attendanceCount = attendanceCount,
                    attendanceRate = calculateAttendanceRate(attendanceCount, matches.size),
                )
            }
            .sortedWith(
                compareByDescending<TeamAttendanceMemberResponse> { it.attendanceRate }
                    .thenByDescending { it.attendanceCount }
                    .thenBy { it.name },
            )
        val fromIndex = (page.toLong() * ATTENDANCE_STATISTICS_PAGE_SIZE)
            .coerceAtMost(memberStatistics.size.toLong())
            .toInt()
        val toIndex = (fromIndex + ATTENDANCE_STATISTICS_PAGE_SIZE).coerceAtMost(memberStatistics.size)

        return TeamAttendanceStatisticsResponse(
            startDate = startDate,
            endDate = endDate,
            totalMatchCount = matches.size,
            page = page,
            pageSize = ATTENDANCE_STATISTICS_PAGE_SIZE,
            totalElements = memberStatistics.size,
            totalPages = (memberStatistics.size + ATTENDANCE_STATISTICS_PAGE_SIZE - 1) /
                ATTENDANCE_STATISTICS_PAGE_SIZE,
            members = memberStatistics.subList(fromIndex, toIndex),
        )
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
        val isMatchParticipant = matchParticipantRepository
            .selectParticipantsByMatchIds(listOf(match.id))
            .any { it.teamMemberId == teamMember.id }
        if (!isMatchParticipant) {
            throw ApiException(MatchErrorCode.MATCH_PARTICIPATION_NOT_AVAILABLE)
        }
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
            goalCount = participant.goalCount,
            assistCount = participant.assistCount,
            cleanSheetCount = participant.cleanSheetCount,
            memo = participant.memo,
            respondedAt = participant.respondedAt,
        )
    }

    fun updateMatchRecord(
        matchId: Long,
        userId: Long,
        request: MatchRecordUpdateRequest,
    ): MatchResponse {
        val match = getMatchAndValidateViewPermission(matchId, userId)
        validateMatchRecordManager(match.teamId, userId)

        if (match.status == MatchStatus.CANCELED) {
            throw ApiException(MatchErrorCode.MATCH_RECORD_UNAVAILABLE)
        }

        val matchParticipantIds = matchParticipantRepository
            .selectParticipantsByMatchIds(listOf(match.id))
            .map { it.teamMemberId }
            .toSet()
        validateMatchRecordRequest(request, matchParticipantIds)

        val teamScore = request.participants.sumOf(MatchParticipantStatisticsUpdateRequest::goalCount)
        val updatedParticipants = matchParticipantRepository.upsertMatchStatistics(
            matchId = match.id,
            statistics = request.participants,
        )
        val updatedMatch = matchRepository.updateMatchRecord(
            matchId = match.id,
            teamScore = teamScore,
            opponentScore = request.opponentScore,
        )
        val currentTeamMember = requireActiveTeamMember(match.teamId, userId)

        return toMatchResponse(updatedMatch, currentTeamMember.id, updatedParticipants)
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

    private fun validateMatchRecordManager(
        teamId: Long,
        userId: Long,
    ) {
        val role = teamRepository.selectActiveMemberRole(teamId, userId)

        if (role != TeamMemberRole.OWNER && role != TeamMemberRole.SUB_MANAGER) {
            throw ApiException(MatchErrorCode.MATCH_RECORD_FORBIDDEN)
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

    private fun validateMatchRecordRequest(
        request: MatchRecordUpdateRequest,
        activeTeamMemberIds: Set<Long>,
    ) {
        if (request.opponentScore !in 0..MAX_MATCH_SCORE) {
            throw ApiException(MatchErrorCode.INVALID_MATCH_RECORD_REQUEST)
        }

        val recordMemberIds = request.participants.map(MatchParticipantStatisticsUpdateRequest::teamMemberId)
        if (recordMemberIds.size != activeTeamMemberIds.size ||
            recordMemberIds.toSet().size != recordMemberIds.size ||
            recordMemberIds.toSet() != activeTeamMemberIds
        ) {
            throw ApiException(MatchErrorCode.INVALID_MATCH_RECORD_REQUEST)
        }

        if (request.participants.any { participant ->
                    participant.goalCount !in 0..MAX_PLAYER_STATISTIC_COUNT ||
                    participant.assistCount !in 0..MAX_PLAYER_STATISTIC_COUNT ||
                    participant.cleanSheetCount !in 0..MAX_PLAYER_STATISTIC_COUNT
            }
        ) {
            throw ApiException(MatchErrorCode.INVALID_MATCH_RECORD_REQUEST)
        }

        val totalGoalCount = request.participants.sumOf(MatchParticipantStatisticsUpdateRequest::goalCount)
        val totalAssistCount = request.participants.sumOf(MatchParticipantStatisticsUpdateRequest::assistCount)
        if (totalAssistCount > totalGoalCount) {
            throw ApiException(MatchErrorCode.INVALID_MATCH_ASSIST_COUNT)
        }
    }

    private fun calculateAttendanceRate(
        attendanceCount: Int,
        totalMatchCount: Int,
    ): Double {
        if (totalMatchCount == 0) {
            return 0.0
        }

        return round(attendanceCount * 1000.0 / totalMatchCount) / 10.0
    }

    private fun toMatchResponse(
        match: MatchRecord,
        teamMemberId: Long,
        participants: List<MatchParticipantRecord>,
    ): MatchResponse {
        return MatchResponse.from(
            match = match,
            availableParticipantCount = participants.count { it.status == MatchParticipantStatus.AVAILABLE },
            isMatchParticipant = participants.any { it.teamMemberId == teamMemberId },
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
        private const val ATTENDANCE_STATISTICS_PAGE_SIZE = 20
        private const val MAX_MATCH_SCORE = 99
        private const val MAX_PLAYER_STATISTIC_COUNT = 99
    }
}
