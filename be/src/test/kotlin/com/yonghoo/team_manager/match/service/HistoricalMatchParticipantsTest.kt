package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.match.repository.*
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.mock
import java.time.LocalDateTime
import java.util.UUID

class HistoricalMatchParticipantsTest {
    private lateinit var db: Database
    private val participants = MatchParticipantRepository()
    private val matches = MatchRepository()
    private val service = MatchService(participants, matches, TeamRepository(), mock(UserRepository::class.java))
    private val formations = MatchFormationService(MatchFormationRepository())
    private val past = LocalDateTime.now().minusDays(7).withNano(0)
    private fun <T> tx(block: () -> T): T = transaction(db) { block() }
    private fun savedParticipants() = participants.selectParticipantsByMatchIds(listOf(1)).sortedBy { it.teamMemberId }
    private fun request() = HistoricalMatchParticipantsUpdateRequest(savedParticipants().map {
        HistoricalMatchParticipantCreateRequest(it.teamMemberId, it.voteStatus)
    })
    // A normal save may update updatedAt; every other participant field must remain identical.
    private fun content(records: List<MatchParticipantRecord>) = records.map { it.copy(updatedAt = past) }

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, MatchesTable, MatchParticipantsTable,
                MatchFormationsTable, MatchFormationPlacementsTable)
            TeamsTable.insert { it[id] = 1; it[createdByUserId] = 10; it[name] = "기록 보존 팀" }
            for (memberId in 1L..8L) TeamMembersTable.insert {
                it[id] = memberId; it[teamId] = if (memberId == 7L) 2 else 1
                it[userId] = if (memberId == 1L) 10 else null
                it[displayName] = "선수 $memberId"
                it[role] = if (memberId == 1L) TeamMemberRole.OWNER else TeamMemberRole.MEMBER
                it[status] = if (memberId in listOf(2L, 6L, 8L)) TeamMemberStatus.LEFT else TeamMemberStatus.ACTIVE
            }
            MatchesTable.insert {
                it[id] = 1; it[teamId] = 1; it[matchType] = MatchType.INTERNAL; it[createdByUserId] = 10
                it[matchAt] = past; it[participationDeadlineAt] = past.minusDays(1)
                it[status] = MatchStatus.COMPLETED; it[teamScore] = 3; it[opponentScore] = 0
            }
            for ((memberId, vote) in listOf(2L to MatchParticipantStatus.AVAILABLE,
                3L to MatchParticipantStatus.AVAILABLE, 4L to MatchParticipantStatus.PENDING,
                5L to MatchParticipantStatus.INVITED)) MatchParticipantsTable.insert {
                it[matchId] = 1; it[teamMemberId] = memberId; it[teamSide] = MatchTeamSide.HOME
                it[voteStatus] = vote; it[actualParticipated] = memberId <= 3; it[late] = memberId == 2L
                it[goalCount] = if (memberId == 2L) 2 else if (memberId == 3L) 1 else 0
                it[assistCount] = if (memberId == 2L) 1 else 0
                it[cleanSheetCount] = if (memberId == 3L) 1 else 0
                it[memo] = "보존할 메모"; it[respondedAt] = if (memberId <= 3) past.minusDays(1) else null
            }
            // A removed participant is not an existing roster member eligible for preservation.
            MatchParticipantsTable.insert {
                it[matchId] = 1; it[teamMemberId] = 8; it[deletedAt] = past
            }
            formations.save(1, 10, MatchFormationRequest("1쿼터", "HOME", "4-4-2",
                listOf(FormationPlacementRequest("GK", 2))))
        }
    }

    @Test
    fun `unchanged save preserves departed scorer votes records score and formation`() = tx {
        val before = savedParticipants()
        val matchBefore = matches.selectMatchById(1)
        val formationsBefore = formations.list(1, 10)
        service.updateHistoricalMatchParticipants(1, 10, request())
        assertEquals(content(before), content(savedParticipants()))
        assertEquals(3, savedParticipants().sumOf { it.goalCount })
        assertEquals(matchBefore, matches.selectMatchById(1))
        assertEquals(formationsBefore, formations.list(1, 10))
    }

    @Test
    fun `active addition and explicit vote change preserve existing personal records`() = tx {
        val before = savedParticipants()
        val changed = request().participants.map {
            if (it.teamMemberId == 4L) it.copy(voteStatus = MatchParticipantStatus.UNAVAILABLE) else it
        } + HistoricalMatchParticipantCreateRequest(1, MatchParticipantStatus.AVAILABLE)
        service.updateHistoricalMatchParticipants(1, 10, HistoricalMatchParticipantsUpdateRequest(changed))
        val after = savedParticipants()
        assertEquals(content(before.map {
            if (it.teamMemberId == 4L) it.copy(voteStatus = MatchParticipantStatus.UNAVAILABLE) else it
        }), content(after.filter { it.teamMemberId != 1L }))
        assertEquals(MatchTeamSide.UNASSIGNED, after.single { it.teamMemberId == 1L }.teamSide)
        assertTrue(after.single { it.teamMemberId == 1L }.actualParticipated)
    }

    @Test
    fun `preservation exception does not admit new inactive foreign or arbitrary unanswered players`() = tx {
        val before = savedParticipants()
        val original = request().participants
        val invalidRequests = listOf(
            emptyList(), original + original.first(),
            original + HistoricalMatchParticipantCreateRequest(6, MatchParticipantStatus.AVAILABLE),
            original + HistoricalMatchParticipantCreateRequest(7, MatchParticipantStatus.AVAILABLE),
            original + HistoricalMatchParticipantCreateRequest(8, MatchParticipantStatus.AVAILABLE),
            original + HistoricalMatchParticipantCreateRequest(1, MatchParticipantStatus.PENDING),
            original + HistoricalMatchParticipantCreateRequest(1, MatchParticipantStatus.INVITED),
            original.map { if (it.teamMemberId == 2L) it.copy(voteStatus = MatchParticipantStatus.PENDING) else it },
            original.map { if (it.teamMemberId == 4L) it.copy(voteStatus = MatchParticipantStatus.INVITED) else it },
        )
        for (invalid in invalidRequests) {
            assertEquals("INVALID_MATCH_REQUEST", assertThrows<ApiException> {
                service.updateHistoricalMatchParticipants(1, 10, HistoricalMatchParticipantsUpdateRequest(invalid))
            }.errorCode.code)
        }
        for (invalid in listOf(2L to MatchParticipantStatus.AVAILABLE, 1L to MatchParticipantStatus.PENDING,
            1L to MatchParticipantStatus.INVITED)) {
            assertEquals("INVALID_MATCH_REQUEST", assertThrows<ApiException> {
                service.createHistoricalMatch(10, HistoricalMatchCreateRequest(
                    1, MatchType.INTERNAL, false, null, past, null,
                    listOf(HistoricalMatchParticipantCreateRequest(invalid.first, invalid.second))))
            }.errorCode.code)
        }
        assertEquals(before, savedParticipants())
    }
}
