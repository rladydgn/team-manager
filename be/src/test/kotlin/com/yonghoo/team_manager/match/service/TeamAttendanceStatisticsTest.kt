package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.match.domain.MatchParticipantRecord
import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchRecord
import com.yonghoo.team_manager.match.domain.MatchStatus
import com.yonghoo.team_manager.match.domain.MatchType
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.TeamMemberRecord
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamMemberStatus
import com.yonghoo.team_manager.team.domain.TeamRecord
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.time.LocalDate

class TeamAttendanceStatisticsTest {
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
        status = MatchStatus.COMPLETED, createdAt = now, updatedAt = now, deletedAt = null,
    )

    @BeforeEach
    fun setup() {
        `when`(teams.selectTeamById(2)).thenReturn(mock(TeamRecord::class.java))
        `when`(teams.selectActiveTeamMemberByTeamAndUser(2, 3)).thenReturn(member)
        `when`(teams.selectMembersByTeamId(2)).thenReturn(listOf(member))
    }

    @Test
    fun `종료 경기의 투표 후 불참은 출석에서 빼고 대상 경기와 불참 횟수에는 남긴다`() {
        `when`(matches.selectMatchesByTeamId(2)).thenReturn((1L..4L).map { match.copy(id = it) })
        `when`(participants.selectParticipantsByMatchIds(listOf(1L, 2L, 3L, 4L))).thenReturn(listOf(
            vote(1, actualParticipated = true).copy(late = true),
            vote(2),
            vote(3, status = MatchParticipantStatus.UNAVAILABLE),
            vote(4, status = MatchParticipantStatus.PENDING),
        ))

        val result = service.getAttendanceStatistics(2, 3, start, end, 0).members.single()

        assertEquals(1, result.attendanceCount)
        assertEquals(4, result.eligibleMatchCount)
        assertEquals(25.0, result.attendanceRate)
        assertEquals(1, result.postVoteAbsenceCount)
        assertEquals(1, result.lateCount)
    }

    @Test
    fun `미종료 경기라도 양 팀 점수가 있으면 실제 불참을 제외하고 미기록 경기의 참석 투표는 유지한다`() {
        val scheduled = match.copy(status = MatchStatus.SCHEDULED, isTraining = true)
        `when`(matches.selectMatchesByTeamId(2)).thenReturn(listOf(
            scheduled,
            scheduled.copy(id = 2, teamScore = 0),
            scheduled.copy(id = 3, teamScore = 0, opponentScore = 0),
            scheduled.copy(id = 4, teamScore = 0, opponentScore = 0),
        ))
        `when`(participants.selectParticipantsByMatchIds(listOf(1L, 2L, 3L, 4L))).thenReturn(listOf(
            vote(1), vote(2), vote(3), vote(4, actualParticipated = true),
        ))

        val result = service.getAttendanceStatistics(2, 3, start, end, 0).members.single()

        assertEquals(3, result.attendanceCount)
        assertEquals(4, result.eligibleMatchCount)
        assertEquals(75.0, result.attendanceRate)
        assertEquals(3, result.trainingAttendanceCount)
        assertEquals(4, result.trainingEligibleMatchCount)
        assertEquals(75.0, result.trainingAttendanceRate)
        assertEquals(1, result.postVoteAbsenceCount)
    }

    @Test
    fun `훈련의 투표 후 불참도 제외하며 취소 경기와 기간 밖 경기는 통계에 포함하지 않는다`() {
        `when`(matches.selectMatchesByTeamId(2)).thenReturn(listOf(
            match,
            match.copy(id = 2, isTraining = true),
            match.copy(id = 3, isTraining = true),
            match.copy(id = 4, isTraining = true, status = MatchStatus.CANCELED),
            match.copy(id = 5, matchAt = end.plusDays(1).atStartOfDay()),
        ))
        `when`(participants.selectParticipantsByMatchIds(listOf(1L, 2L, 3L))).thenReturn(listOf(
            vote(1, actualParticipated = true), vote(2, actualParticipated = true), vote(3),
        ))
        `when`(teams.selectMembersByTeamId(2)).thenReturn(listOf(member, member.copy(id = 11)))

        val statistics = service.getAttendanceStatistics(2, 3, start, end, 0)
        val result = statistics.members.first()

        assertEquals(3, statistics.totalMatchCount)
        assertEquals(2, statistics.totalTrainingCount)
        assertEquals(2, result.attendanceCount)
        assertEquals(3, result.eligibleMatchCount)
        assertEquals(66.7, result.attendanceRate)
        assertEquals(1, result.trainingAttendanceCount)
        assertEquals(2, result.trainingEligibleMatchCount)
        assertEquals(50.0, result.trainingAttendanceRate)
        assertEquals(1, result.postVoteAbsenceCount)
        assertEquals(0.0, statistics.members.last().attendanceRate)
        assertEquals(0.0, statistics.members.last().trainingAttendanceRate)
    }

    private fun vote(
        matchId: Long,
        actualParticipated: Boolean = false,
        status: MatchParticipantStatus = MatchParticipantStatus.AVAILABLE,
    ) = MatchParticipantRecord(
        id = matchId, matchId = matchId, teamMemberId = member.id, voteStatus = status,
        actualParticipated = actualParticipated, late = false, goalCount = 0, assistCount = 0, cleanSheetCount = 0,
        memo = null, respondedAt = null, createdAt = now, updatedAt = now,
    )
}
