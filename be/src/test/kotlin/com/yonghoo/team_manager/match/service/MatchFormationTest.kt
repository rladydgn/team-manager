package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.match.repository.MatchFormationRepository
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.team.domain.*
import org.jetbrains.exposed.v1.core.*
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.sql.Connection
import java.time.LocalDateTime
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class MatchFormationTest {
    private lateinit var db: Database
    private val service = MatchFormationService(MatchFormationRepository())
    private val now = LocalDateTime.of(2026, 10, 19, 12, 0)
    private fun <T> tx(block: () -> T): T = transaction(db = db, transactionIsolation = Connection.TRANSACTION_READ_COMMITTED, readOnly = false) { block() }
    private fun request(side: String = "HOME", placements: List<FormationPlacementRequest> = emptyList(), version: Long? = null) =
        MatchFormationRequest(" 1쿼터 ", side, "4-4-2", placements, version)

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, MatchesTable, MatchParticipantsTable, MatchFormationsTable, MatchFormationPlacementsTable)
            TeamsTable.insert { it[id] = 1; it[createdByUserId] = 10; it[name] = "우리 팀" }
            for ((id, user, role) in listOf(Triple(1L, 10L, TeamMemberRole.OWNER), Triple(2L, 20L, TeamMemberRole.MEMBER), Triple(3L, 30L, TeamMemberRole.SUB_MANAGER))) {
                TeamMembersTable.insert { it[this.id] = id; it[teamId] = 1; it[userId] = user; it[displayName] = "선수 $id"; it[this.role] = role }
            }
            TeamMembersTable.insert { it[id] = 4; it[teamId] = 1; it[displayName] = "계정 없는 용병"; it[role] = TeamMemberRole.GUEST; it[status] = TeamMemberStatus.LEFT }
            for (id in 1L..2L) MatchesTable.insert {
                it[this.id] = id; it[teamId] = 1; it[matchType] = MatchType.INTERNAL; it[createdByUserId] = 10;
                it[matchAt] = now; it[participationDeadlineAt] = now.minusDays(1)
            }
            for (id in 1L..4L) MatchParticipantsTable.insert {
                it[matchId] = 1; it[teamMemberId] = id; it[teamSide] = MatchTeamSide.HOME; it[voteStatus] = MatchParticipantStatus.AVAILABLE
            }
        }
    }

    @Test
    fun `eight templates contain eleven unique fixed slots`() {
        assertEquals(8, FormationTemplates.all.size)
        for (template in FormationTemplates.all) {
            assertEquals(11, template.slots.map { it.id }.distinct().size)
            assertTrue(template.slots.all { it.x in 0.0..1.0 && it.y in 0.0..1.0 })
        }
    }

    @Test
    fun `partial placements include unregistered historical players and do not modify match statistics`() = tx {
        val formation = service.save(1, 10, request(placements = listOf(FormationPlacementRequest("GK", 4))))
        assertEquals("1쿼터", formation.title)
        assertTrue(formation.placements.single().eligible)
        assertEquals("계정 없는 용병", formation.placements.single().name)
        assertFalse(MatchParticipantsTable.selectAll().first()[MatchParticipantsTable.actualParticipated])
        assertEquals(0, MatchParticipantsTable.selectAll().first()[MatchParticipantsTable.goalCount])
        assertEquals(4, service.list(1, 20).attendingPlayers.size)
        assertFalse(service.list(1, 20).permissions.canUpdate)
        assertEquals("RESOURCE_NOT_FOUND", assertThrows<ApiException> { service.save(1, 20, request()) }.errorCode.code)
        assertEquals("RESOURCE_NOT_FOUND", assertThrows<ApiException> { service.list(1, 99) }.errorCode.code)
        assertEquals("RESOURCE_NOT_FOUND", assertThrows<ApiException> { service.delete(2, formation.id, 10, 1) }.errorCode.code)
    }

    @Test
    fun `vote and side changes retain excluded placements and can become eligible again`() = tx {
        val saved = service.save(1, 10, request(placements = listOf(FormationPlacementRequest("GK", 1))))
        service.assignSides(1, 10, ParticipantSidesRequest(1, listOf(SideAssignmentRequest(1, "AWAY"))))
        assertEquals("SIDE_MISMATCH", service.list(1, 20).formations.single().placements.single().ineligibleReason)
        assertEquals(saved.version, service.list(1, 20).formations.single().version)
        assertEquals("MATCH_FORMATION_PLAYER_INELIGIBLE", assertThrows<ApiException> { service.save(1, 10, request(placements = listOf(FormationPlacementRequest("GK", 1)), version = 1), saved.id) }.errorCode.code)
        service.assignSides(1, 10, ParticipantSidesRequest(2, listOf(SideAssignmentRequest(1, "UNASSIGNED"))))
        assertEquals("SIDE_UNASSIGNED", service.list(1, 20).formations.single().placements.single().ineligibleReason)
        service.assignSides(1, 10, ParticipantSidesRequest(3, listOf(SideAssignmentRequest(1, "HOME"))))
        MatchParticipantsTable.update({ MatchParticipantsTable.teamMemberId eq 1 }) { it[voteStatus] = MatchParticipantStatus.UNAVAILABLE; it[actualParticipated] = true }
        assertEquals("NOT_ATTENDING", service.list(1, 20).formations.single().placements.single().ineligibleReason)
        MatchParticipantsTable.update({ MatchParticipantsTable.teamMemberId eq 1 }) { it[voteStatus] = MatchParticipantStatus.AVAILABLE }
        assertTrue(service.list(1, 20).formations.single().placements.single().eligible)
        TeamMembersTable.update({ TeamMembersTable.id eq 1 }) { it[deletedAt] = now }
        assertEquals("MEMBER_REMOVED", service.list(1, 30).formations.single().placements.single().ineligibleReason)
    }

    @Test
    fun `invalid titles slots duplicates versions and sides fail without writes`() = tx {
        val invalid = listOf(request().copy(title = " "), request().copy(title = "a".repeat(51)), request().copy(title = "a\nb"),
            request().copy(templateId = "invalid"), request("UNASSIGNED"), request(placements = listOf(FormationPlacementRequest("unknown", 1))),
            request(placements = listOf(FormationPlacementRequest("GK", 1), FormationPlacementRequest("GK", 2))),
            request(placements = listOf(FormationPlacementRequest("GK", 1), FormationPlacementRequest("R1_1", 1))))
        invalid.forEach { assertEquals("INVALID_MATCH_FORMATION_REQUEST", assertThrows<ApiException> { service.save(1, 10, it) }.errorCode.code) }
        assertTrue(service.list(1, 10).formations.isEmpty())
        val saved = service.save(1, 10, request())
        service.save(1, 30, request(version = 1), saved.id)
        assertEquals("MATCH_FORMATION_VERSION_CONFLICT", assertThrows<ApiException> { service.delete(1, saved.id, 10, 1) }.errorCode.code)
        assertEquals("INVALID_MATCH_SIDE_ASSIGNMENT_REQUEST", assertThrows<ApiException> { service.assignSides(1, 10, ParticipantSidesRequest(1, listOf(SideAssignmentRequest(1, "AWAY"), SideAssignmentRequest(999, "HOME")))) }.errorCode.code)
        assertEquals(MatchTeamSide.HOME, service.sides(1, 20).players.first { it.teamMemberId == 1L }.side)
    }

    @Test
    fun `canceled matches allow authorized deletion only and external side assignment is hidden`() = tx {
        val saved = service.save(1, 10, request())
        MatchesTable.update({ MatchesTable.id eq 1 }) { it[status] = MatchStatus.CANCELED }
        assertFalse(service.list(1, 10).permissions.canCreate)
        assertEquals("MATCH_FORMATION_MATCH_CANCELED", assertThrows<ApiException> { service.save(1, 10, request()) }.errorCode.code)
        assertEquals("MATCH_SIDE_ASSIGNMENT_MATCH_CANCELED", assertThrows<ApiException> { service.assignSides(1, 10, ParticipantSidesRequest(1, listOf(SideAssignmentRequest(1, "AWAY")))) }.errorCode.code)
        service.delete(1, saved.id, 30, 1)
        assertTrue(service.list(1, 20).formations.isEmpty())
        MatchesTable.update({ MatchesTable.id eq 2 }) { it[matchType] = MatchType.EXTERNAL }
        assertEquals("RESOURCE_NOT_FOUND", assertThrows<ApiException> { service.sides(2, 10) }.errorCode.code)
    }

    @Test
    fun `all new internal participants are unassigned and restored participants retain sides`() = tx {
        val repo = MatchParticipantRepository()
        assertEquals(MatchTeamSide.UNASSIGNED, repo.createDefaultParticipants(2, listOf(1)).single().teamSide)
        assertEquals(MatchTeamSide.UNASSIGNED, repo.createHistoricalParticipants(2, listOf(HistoricalMatchParticipantCreateRequest(2, MatchParticipantStatus.AVAILABLE))).single().teamSide)
        assertEquals(MatchTeamSide.UNASSIGNED, repo.upsertParticipation(2, 3, MatchParticipantStatus.AVAILABLE, null, false).teamSide)
        repo.removeParticipant(1, 4)
        assertEquals(MatchTeamSide.HOME, repo.upsertParticipation(1, 4, MatchParticipantStatus.AVAILABLE, null, false).teamSide)
    }

    @Test
    fun `concurrent creation enforces one shared home away limit and deletion frees capacity`() {
        tx { repeat(9) { service.save(1, 10, request(if (it % 2 == 0) "HOME" else "AWAY")) } }
        val results = race({ service.save(1, 10, request()) }, { service.save(1, 30, request("AWAY")) })
        assertEquals(1, results.count { it == "OK" })
        assertEquals(1, results.count { it == "MATCH_FORMATION_LIMIT_REACHED" })
        tx {
            val formations = service.list(1, 10).formations
            assertEquals(10, formations.size)
            service.delete(1, formations.first().id, 10, 1)
            service.save(1, 10, request())
            assertEquals(10, service.list(1, 10).formations.size)
        }
    }

    @Test
    fun `concurrent updates and side assignments reject stale versions`() {
        val saved = tx { service.save(1, 10, request()) }
        assertEquals(listOf("MATCH_FORMATION_VERSION_CONFLICT", "OK"), race(
            { service.save(1, 10, request(version = 1), saved.id) }, { service.save(1, 30, request(version = 1), saved.id) }).sorted())
        assertEquals(listOf("MATCH_SIDE_ASSIGNMENT_VERSION_CONFLICT", "OK"), race(
            { service.assignSides(1, 10, ParticipantSidesRequest(1, listOf(SideAssignmentRequest(1, "HOME")))) },
            { service.assignSides(1, 30, ParticipantSidesRequest(1, listOf(SideAssignmentRequest(1, "AWAY")))) }).sorted())
    }

    private fun race(first: () -> Any, second: () -> Any): List<String> {
        val start = CountDownLatch(1)
        val pool = Executors.newFixedThreadPool(2)
        try {
            val futures = listOf(first, second).map { action -> pool.submit(Callable {
                start.await()
                try { tx { action() }; "OK" } catch (error: ApiException) { error.errorCode.code }
            }) }
            start.countDown()
            return futures.map { it.get(20, TimeUnit.SECONDS) }
        } finally { pool.shutdownNow() }
    }
}
