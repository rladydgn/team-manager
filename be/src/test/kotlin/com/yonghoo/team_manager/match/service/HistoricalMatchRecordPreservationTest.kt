package com.yonghoo.team_manager.match.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.match.repository.*
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.team.service.TeamLogoStorage
import com.yonghoo.team_manager.team.service.TeamService
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

class HistoricalMatchRecordPreservationTest {
    private lateinit var db: Database
    private val participants = MatchParticipantRepository()
    private val matches = MatchRepository()
    private val teams = TeamRepository()
    private val users = mock(UserRepository::class.java)
    private val service = MatchService(participants, matches, teams, users)
    private val teamService = TeamService(teams, users, ObjectMapper(), matches, participants, mock(TeamLogoStorage::class.java))
    private val formations = MatchFormationService(MatchFormationRepository())
    private fun <T> tx(block: () -> T): T = transaction(db) { block() }
    private fun saved() = participants.selectParticipantsByMatchIds(listOf(1)).sortedBy { it.teamMemberId }
    private fun without(vararg ids: Long) = HistoricalMatchParticipantsUpdateRequest(saved()
        .filter { it.teamMemberId !in ids }.map { HistoricalMatchParticipantCreateRequest(it.teamMemberId, it.voteStatus) })

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, MatchesTable, MatchParticipantsTable,
                MatchFormationsTable, MatchFormationPlacementsTable)
            TeamsTable.insert { it[id] = 1; it[createdByUserId] = 10; it[name] = "기록 보존 팀" }
            for (memberId in 1L..5L) TeamMembersTable.insert {
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
            for (memberId in 2L..5L) MatchParticipantsTable.insert {
                it[matchId] = 1; it[teamMemberId] = memberId; it[teamSide] = MatchTeamSide.HOME
                it[voteStatus] = if (memberId <= 3) MatchParticipantStatus.AVAILABLE else MatchParticipantStatus.PENDING
                it[actualParticipated] = memberId <= 3
                it[goalCount] = if (memberId == 2L) 2 else if (memberId == 3L) 1 else 0
                it[memo] = "투표 메모 보존"
            }
            formations.save(1, 10, MatchFormationRequest("1쿼터", "HOME", "4-4-2",
                listOf(FormationPlacementRequest("GK", 2))))
        }
    }

    @Test
    fun `team departure and attempted roster exclusion preserve score records votes and formation atomically`() = tx {
        val before = saved()
        val matchBefore = matches.selectMatchById(1)
        val formationBefore = formations.list(1, 10)
        teamService.removeTeamMember(1, 2, 10)
        teamService.removeTeamMember(1, 4, 10)
        assertEquals(TeamMemberStatus.LEFT, teams.selectTeamMemberById(1, 2)?.status)
        assertEquals(before, saved())
        for (memberId in listOf(2L, 4L)) {
            // Also request a valid removal to ensure rejection happens before any partial write.
            val error = assertThrows<ApiException> { service.updateHistoricalMatchParticipants(1, 10, without(memberId, 5)) }
            assertEquals("MATCH_PARTICIPANT_RECORD_PRESERVED", error.errorCode.code)
            assertEquals(409, error.errorCode.status.value())
            assertEquals(before, saved())
        }
        assertEquals(matchBefore, matches.selectMatchById(1))
        assertEquals(formationBefore, formations.list(1, 10))
        assertEquals(3, saved().sumOf { it.goalCount })
    }

    @Test
    fun `each actual attendance late or personal statistic blocks removal for active players`() = tx {
        for (field in listOf("attendance", "late", "goal", "assist", "cleanSheet")) {
            MatchParticipantsTable.update({ MatchParticipantsTable.teamMemberId eq 4 }) {
                it[actualParticipated] = field == "attendance"; it[late] = field == "late"
                it[goalCount] = if (field == "goal") 1 else 0
                it[assistCount] = if (field == "assist") 1 else 0
                it[cleanSheetCount] = if (field == "cleanSheet") 1 else 0
            }
            val before = saved()
            assertEquals("MATCH_PARTICIPANT_RECORD_PRESERVED", assertThrows<ApiException> {
                service.updateHistoricalMatchParticipants(1, 10, without(4))
            }.errorCode.code, field)
            assertEquals(before, saved(), field)
        }
    }

    @Test
    fun `an active unrecorded participant can still be corrected without changing recorded players`() = tx {
        val before = saved().filter { it.teamMemberId != 5L }
        val matchBefore = matches.selectMatchById(1)
        service.updateHistoricalMatchParticipants(1, 10, without(5))
        assertEquals(before.map { it.copy(updatedAt = LocalDateTime.MIN) }, saved().map { it.copy(updatedAt = LocalDateTime.MIN) })
        assertEquals(matchBefore, matches.selectMatchById(1))
    }
}
