package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.exception.MatchErrorCode
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.*
import java.time.LocalDate

class TeamParticipationVotesTest {
    private val matches = mock(MatchRepository::class.java)
    private val participants = mock(MatchParticipantRepository::class.java)
    private val teams = mock(TeamRepository::class.java)
    private val service = MatchService(participants, matches, teams, mock(UserRepository::class.java))
    private val start = LocalDate.of(2026, 9, 1)
    private val end = LocalDate.of(2026, 9, 30)
    private val now = start.atStartOfDay()
    private val member = TeamMemberRecord(
        10, 2, 3, "선수", null, TeamMemberRole.MEMBER, TeamMemberStatus.ACTIVE,
        now, now, now, null,
    )
    private val match = MatchRecord(
        id = 1, teamId = 2, matchType = MatchType.INTERNAL, isTraining = false,
        opponentTeamId = null, opponentTeamName = null, createdByUserId = 3,
        matchAt = now, participationDeadlineAt = now, location = null,
        teamScore = null, unknownGoalCount = 0, opponentScore = null, unknownAssistCount = 0,
        status = MatchStatus.SCHEDULED, createdAt = now, updatedAt = now, deletedAt = null,
    )

    @BeforeEach
    fun setup() {
        `when`(teams.selectTeamById(2)).thenReturn(mock(TeamRecord::class.java))
        `when`(teams.selectActiveTeamMemberByTeamAndUser(2, 3)).thenReturn(member)
        `when`(teams.selectMembersByTeamId(2)).thenReturn(listOf(member))
    }

    @Test
    fun `기간 양끝과 훈련을 포함하고 취소와 기간 밖 경기는 제외하며 날짜순으로 투표를 반환한다`() {
        `when`(matches.selectMatchesByTeamId(2)).thenReturn(listOf(
            match.copy(id = 4, matchAt = end.atTime(23, 59), isTraining = true),
            match.copy(id = 3, matchAt = now.plusDays(1)),
            match.copy(id = 2), // 같은 날짜의 경기도 별도 열
            match,
            match.copy(id = 5, status = MatchStatus.CANCELED),
            match.copy(id = 6, matchAt = now.minusNanos(1)),
            match.copy(id = 7, matchAt = end.plusDays(1).atStartOfDay()),
        ))
        `when`(participants.selectParticipantsByMatchIds(listOf(1L, 2L, 3L, 4L))).thenReturn(listOf(
            vote(1, MatchParticipantStatus.AVAILABLE),
            vote(2, MatchParticipantStatus.UNAVAILABLE),
            vote(3, MatchParticipantStatus.PENDING),
            vote(4, MatchParticipantStatus.INVITED),
            vote(1, MatchParticipantStatus.AVAILABLE).copy(teamMemberId = 99),
        ))

        val result = service.getParticipationVotes(2, 3, start, end, 0)

        assertEquals(listOf(1L, 2L, 3L, 4L), result.matches.map { it.id })
        assertTrue(result.matches.last().isTraining)
        assertEquals(1, result.members.size)
        assertEquals(mapOf(
            1L to MatchParticipantStatus.AVAILABLE, 2L to MatchParticipantStatus.UNAVAILABLE,
            3L to MatchParticipantStatus.PENDING, 4L to MatchParticipantStatus.INVITED,
        ), result.members.single().votes)
    }

    @Test
    fun `참가 기록이 없는 팀원도 페이지에 포함하고 페이지별로 팀원을 분리한다`() {
        `when`(matches.selectMatchesByTeamId(2)).thenReturn(listOf(match))
        `when`(teams.selectMembersByTeamId(2)).thenReturn((1L..21L).map { member.copy(id = it) })
        `when`(participants.selectParticipantsByMatchIds(listOf(1L))).thenReturn(emptyList())

        val result = service.getParticipationVotes(2, 3, start, end, 1)

        assertEquals(21, result.totalElements)
        assertEquals(2, result.totalPages)
        assertEquals(21L, result.members.single().teamMemberId)
        assertTrue(result.members.single().votes.isEmpty())
        assertTrue(service.getParticipationVotes(2, 3, start, end, Int.MAX_VALUE).members.isEmpty())
    }

    @Test
    fun `비팀원은 경기 투표를 조회할 수 없다`() {
        `when`(teams.selectActiveTeamMemberByTeamAndUser(2, 3)).thenReturn(null)
        assertEquals(MatchErrorCode.MATCH_VIEW_FORBIDDEN, assertThrows<ApiException> {
            service.getParticipationVotes(2, 3, start, end, 0)
        }.errorCode)
        verifyNoInteractions(matches, participants)
    }

    @Test
    fun `잘못된 기간과 음수 페이지는 거절한다`() {
        assertEquals(MatchErrorCode.INVALID_MATCH_STATISTICS_REQUEST, assertThrows<ApiException> {
            service.getParticipationVotes(2, 3, end, start, 0)
        }.errorCode)
        assertEquals(MatchErrorCode.INVALID_MATCH_STATISTICS_REQUEST, assertThrows<ApiException> {
            service.getParticipationVotes(2, 3, start, end, -1)
        }.errorCode)
        verifyNoInteractions(matches, participants, teams)
    }

    private fun vote(matchId: Long, status: MatchParticipantStatus) = MatchParticipantRecord(
        id = matchId, matchId = matchId, teamMemberId = member.id, voteStatus = status,
        actualParticipated = false, late = false, goalCount = 0, assistCount = 0, cleanSheetCount = 0,
        memo = null, respondedAt = null, createdAt = now, updatedAt = now,
    )
}
