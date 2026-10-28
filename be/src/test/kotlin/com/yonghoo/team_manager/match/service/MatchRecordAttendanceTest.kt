package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.mock
import java.time.LocalDateTime
import java.util.UUID

class MatchRecordAttendanceTest {
    private lateinit var db: Database
    private val participants = MatchParticipantRepository()
    private val matches = MatchRepository()
    private val service = MatchService(participants, matches, TeamRepository(), mock(UserRepository::class.java))
    private fun <T> tx(block: () -> T): T = transaction(db) { block() }
    private fun saved() = participants.selectParticipantsByMatchIds(listOf(1)).sortedBy { it.teamMemberId }
    private fun request(first: MatchParticipantStatisticsUpdateRequest) = MatchRecordUpdateRequest(
        opponentScore = 0, unknownGoalCount = 1,
        participants = listOf(first, MatchParticipantStatisticsUpdateRequest(3, true, false, 1, 0, 0)),
    )

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, MatchesTable, MatchParticipantsTable)
            TeamsTable.insert { it[id] = 1; it[createdByUserId] = 10; it[name] = "출석 검증 팀" }
            for (memberId in 1L..3L) TeamMembersTable.insert {
                it[id] = memberId; it[teamId] = 1; it[userId] = if (memberId == 1L) 10 else null
                it[displayName] = "선수 $memberId"
                it[role] = if (memberId == 1L) TeamMemberRole.OWNER else TeamMemberRole.MEMBER
            }
            val past = LocalDateTime.now().minusDays(7)
            MatchesTable.insert {
                it[id] = 1; it[teamId] = 1; it[matchType] = MatchType.INTERNAL; it[createdByUserId] = 10
                it[matchAt] = past; it[participationDeadlineAt] = past.minusDays(1)
                it[status] = MatchStatus.COMPLETED; it[teamScore] = 3; it[opponentScore] = 0
            }
            for (memberId in 2L..3L) MatchParticipantsTable.insert {
                it[matchId] = 1; it[teamMemberId] = memberId; it[voteStatus] = MatchParticipantStatus.AVAILABLE
                it[actualParticipated] = true; it[goalCount] = if (memberId == 2L) 2 else 1
            }
        }
    }

    @Test
    fun `each absent personal record is rejected before any participant or score write`() = tx {
        val before = saved()
        val matchBefore = matches.selectMatchById(1)
        for (field in listOf("late", "goal", "assist", "cleanSheet")) {
            val invalid = MatchParticipantStatisticsUpdateRequest(2, false, field == "late",
                if (field == "goal") 1 else 0, if (field == "assist") 1 else 0,
                if (field == "cleanSheet") 1 else 0)
            val error = assertThrows<ApiException> { service.updateMatchRecord(1, 10, request(invalid)) }
            assertEquals("INVALID_MATCH_RECORD_REQUEST", error.errorCode.code, field)
            assertEquals(400, error.errorCode.status.value())
            assertEquals(before, saved(), field)
            assertEquals(matchBefore, matches.selectMatchById(1), field)
        }
    }

    @Test
    fun `existing contradiction is returned unchanged and requires explicit attendance or record correction`() = tx {
        MatchParticipantsTable.update({ MatchParticipantsTable.teamMemberId eq 2 }) { it[actualParticipated] = false }
        val legacy = saved().first()
        assertFalse(service.getMatchParticipants(1, 10).first { it.teamMemberId == 2L }.actualParticipated)
        val unchanged = MatchParticipantStatisticsUpdateRequest(2, false, false, 2, 0, 0)
        assertThrows<ApiException> { service.updateMatchRecord(1, 10, request(unchanged)) }
        assertEquals(legacy, saved().first())
        service.updateMatchRecord(1, 10, request(unchanged.copy(actualParticipated = true)))
        assertTrue(saved().first().actualParticipated)
        assertEquals(2, saved().first().goalCount)
        service.updateMatchRecord(1, 10, request(unchanged.copy(goalCount = 0)))
        assertFalse(saved().first().actualParticipated)
        assertEquals(0, saved().first().goalCount)
    }

    @Test
    fun `normal record round trip preserves actual attendance votes and personal statistics`() = tx {
        val request = request(MatchParticipantStatisticsUpdateRequest(2, true, true, 2, 1, 1))
        service.updateMatchRecord(1, 10, request)
        val before = saved()
        val matchBefore = matches.selectMatchById(1)
        service.updateMatchRecord(1, 10, request)
        assertEquals(before.map { it.copy(updatedAt = LocalDateTime.MIN) }, saved().map { it.copy(updatedAt = LocalDateTime.MIN) })
        assertEquals(matchBefore?.teamScore, matches.selectMatchById(1)?.teamScore)
        assertEquals(4, matches.selectMatchById(1)?.teamScore)
    }
}
