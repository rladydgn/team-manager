package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.match.controller.MatchController
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.match.repository.*
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.repository.UserRepository
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.mock
import org.springframework.http.MediaType
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import java.time.LocalDateTime
import java.util.UUID
import java.nio.file.Files
import java.nio.file.Path

class ProxyParticipationTest {
    private lateinit var db: Database
    private val participants = MatchParticipantRepository()
    private val matches = MatchRepository()
    private val service = MatchService(participants, matches, TeamRepository(), mock(UserRepository::class.java))
    private val formations = MatchFormationService(MatchFormationRepository())
    private fun <T> tx(block: () -> T): T = transaction(db) { block() }
    private fun proxy(target: Long = 4, status: MatchParticipantStatus = MatchParticipantStatus.AVAILABLE, reason: String? = null, actor: Long = 10) =
        service.updateProxyParticipation(1, target, actor, ProxyParticipationUpdateRequest(status, reason))
    private fun saved() = participants.selectParticipantsByMatchIds(listOf(1)).sortedBy { it.teamMemberId }

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, MatchesTable, MatchParticipantsTable,
                MatchParticipationHistoriesTable, MatchFormationsTable, MatchFormationPlacementsTable)
            for (team in 1L..2L) TeamsTable.insert { it[id] = team; it[createdByUserId] = 10; it[name] = "팀 $team" }
            for (member in 1L..7L) TeamMembersTable.insert {
                it[id] = member; it[teamId] = if (member == 7L) 2 else 1
                it[userId] = when(member) { 1L -> 10; 2L -> 20; 3L -> 30; else -> null }
                it[displayName] = "선수 $member"
                it[role] = when(member) { 1L -> TeamMemberRole.OWNER; 2L -> TeamMemberRole.SUB_MANAGER; 4L -> TeamMemberRole.GUEST; else -> TeamMemberRole.MEMBER }
                it[status] = when(member) { 5L -> TeamMemberStatus.LEFT; 6L -> TeamMemberStatus.PENDING; else -> TeamMemberStatus.ACTIVE }
            }
            MatchesTable.insert {
                it[id] = 1; it[teamId] = 1; it[matchType] = MatchType.INTERNAL; it[createdByUserId] = 10
                it[matchAt] = LocalDateTime.now().plusDays(2); it[participationDeadlineAt] = LocalDateTime.now().plusDays(1)
            }
            MatchParticipantsTable.insert {
                it[matchId] = 1; it[teamMemberId] = 3; it[voteStatus] = MatchParticipantStatus.UNAVAILABLE
                it[memo] = "본인 메모"; it[respondedAt] = LocalDateTime.now().minusDays(1)
                it[actualParticipated] = true; it[goalCount] = 2; it[assistCount] = 1; it[cleanSheetCount] = 1; it[late] = true
                it[teamSide] = MatchTeamSide.HOME
            }
        }
    }

    @Test
    fun `owner and submanager register active members and unregistered guests without touching records or placements`() = tx {
        assertNull(service.getMatchParticipants(1, 30).single().participationSource)
        val before = saved().single()
        proxy(3)
        val after = saved().first { it.teamMemberId == 3L }
        assertEquals(before.copy(voteStatus = after.voteStatus, participationSource = after.participationSource,
            respondedAt = after.respondedAt, updatedAt = after.updatedAt), after)
        val guest = proxy(actor = 20)
        assertFalse(guest.actualParticipated)
        assertEquals(MatchTeamSide.UNASSIGNED, guest.teamSide)
        assertEquals(ParticipationSource.PROXY, guest.participationSource)
        assertTrue(formations.list(1, 30).attendingPlayers.any { it.teamMemberId == 4L })
        formations.assignSides(1, 10, ParticipantSidesRequest(1, listOf(SideAssignmentRequest(4, "HOME"))))
        val formation = formations.save(1, 10, MatchFormationRequest("1쿼터", "HOME", "4-4-2", listOf(FormationPlacementRequest("GK", 4))))
        proxy(status = MatchParticipantStatus.UNAVAILABLE)
        assertEquals("NOT_ATTENDING", formations.list(1, 30).formations.single().placements.single().ineligibleReason)
        proxy()
        assertTrue(formations.list(1, 30).formations.single().placements.single().eligible)
        assertEquals(formation.version, formations.list(1, 30).formations.single().version)
        assertNull(matches.selectMatchById(1)?.teamScore)
        assertEquals("선수 2", service.getParticipationHistory(1, 4, 10).last().actorName)
    }

    @Test
    fun `deadline correction needs reason and started recorded or canceled matches reject without partial writes`() = tx {
        MatchesTable.update({ MatchesTable.id eq 1 }) { it[participationDeadlineAt] = LocalDateTime.now().minusSeconds(1) }
        for (reason in listOf(null, "  ", "a".repeat(501))) {
            assertEquals("INVALID_PROXY_PARTICIPATION_REASON", assertThrows<ApiException> { proxy(reason = reason) }.errorCode.code)
        }
        assertEquals(1, saved().size)
        assertTrue(service.getParticipationHistory(1, 4, 10).isEmpty())
        proxy(reason = "  전화 확인  ")
        assertEquals("전화 확인", service.getParticipationHistory(1, 4, 20).single().reason)
        assertEquals("MATCH_PARTICIPATION_CLOSED", assertThrows<ApiException> {
            service.updateMatchParticipation(1, 30, MatchParticipationUpdateRequest(MatchParticipantStatus.AVAILABLE))
        }.errorCode.code)
        val before = saved()
        for (condition in listOf("started", "completed", "canceled", "score")) {
            MatchesTable.update({ MatchesTable.id eq 1 }) {
                it[matchAt] = if (condition == "started") LocalDateTime.now().minusSeconds(1) else LocalDateTime.now().plusDays(1)
                it[status] = when(condition) { "completed" -> MatchStatus.COMPLETED; "canceled" -> MatchStatus.CANCELED; else -> MatchStatus.SCHEDULED }
                it[teamScore] = if (condition == "score") 0 else null
            }
            assertEquals("MATCH_PARTICIPATION_CLOSED", assertThrows<ApiException> { proxy(reason = "정정") }.errorCode.code, condition)
            assertEquals(before, saved(), condition)
            assertEquals(1, service.getParticipationHistory(1, 4, 10).size)
        }
    }

    @Test
    fun `self reanswer changes origin but memo only self save retains proxy source and immutable history`() = tx {
        proxy(3)
        val before = saved().single()
        service.updateMatchParticipation(1, 30, MatchParticipationUpdateRequest(MatchParticipantStatus.AVAILABLE, "메모 수정"))
        assertEquals(ParticipationSource.PROXY, saved().single().participationSource)
        assertEquals(before.respondedAt, saved().single().respondedAt)
        assertEquals(1, service.getParticipationHistory(1, 3, 10).size)
        service.updateMatchParticipation(1, 30, MatchParticipationUpdateRequest(MatchParticipantStatus.UNAVAILABLE))
        assertEquals(ParticipationSource.SELF, saved().single().participationSource)
        assertEquals("메모 수정", saved().single().memo)
        val history = service.getParticipationHistory(1, 3, 10)
        assertEquals(listOf(ParticipationSource.SELF, ParticipationSource.PROXY), history.map { it.source })
        assertEquals(MatchParticipantStatus.AVAILABLE, history.first().previousStatus)
        assertEquals(MatchParticipantStatus.UNAVAILABLE, history.last().previousStatus)
    }

    @Test
    fun `inactive foreign deleted and invalid targets or statuses are rejected without history`() = tx {
        for (target in listOf(0L, 5L, 6L, 7L, 999L)) {
            assertEquals("INVALID_PROXY_PARTICIPATION_TARGET", assertThrows<ApiException> { proxy(target) }.errorCode.code)
        }
        TeamMembersTable.update({ TeamMembersTable.id eq 4 }) { it[deletedAt] = LocalDateTime.now() }
        assertEquals("INVALID_PROXY_PARTICIPATION_TARGET", assertThrows<ApiException> { proxy() }.errorCode.code)
        for (status in listOf(MatchParticipantStatus.PENDING, MatchParticipantStatus.INVITED)) {
            assertEquals("INVALID_MATCH_PARTICIPATION_REQUEST", assertThrows<ApiException> { proxy(3, status) }.errorCode.code)
        }
        assertEquals(1, saved().size)
        assertEquals(0L, MatchParticipationHistoriesTable.selectAll().count())
    }

    @Test
    fun `direct HTTP proxy and history endpoints enforce manager auth and hide private fields from participant responses`() = tx {
        val mvc = MockMvcBuilders.standaloneSetup(MatchController(service))
            .setControllerAdvice(GlobalExceptionHandler())
            .setMessageConverters(JacksonJsonHttpMessageConverter()).build()
        val url = "/matches/1/participants/4/participation"
        val historyUrl = "/matches/1/participants/4/participation-history"
        mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content("""{"voteStatus":"AVAILABLE"}"""))
            .andExpect(status().isUnauthorized)
        for (actor in listOf(30L, 99L)) {
            mvc.perform(put(url).requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, actor).contentType(MediaType.APPLICATION_JSON).content("""{"voteStatus":"AVAILABLE"}"""))
                .andExpect(status().isNotFound)
            mvc.perform(get(historyUrl).requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, actor)).andExpect(status().isNotFound)
        }
        mvc.perform(put(url).requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 20L).contentType(MediaType.APPLICATION_JSON).content("""{"voteStatus":"AVAILABLE","reason":"운영진 전용 사유"}"""))
            .andExpect(status().isOk).andExpect(jsonPath("$.data.participationSource").value("PROXY"))
        mvc.perform(get("/matches/1/participants").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 30L))
            .andExpect(status().isOk).andExpect(jsonPath("$.data[1].participationSource").value("PROXY"))
            .andExpect(jsonPath("$.data[1].reason").doesNotExist()).andExpect(jsonPath("$.data[1].actorName").doesNotExist())
        mvc.perform(get(historyUrl).requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L))
            .andExpect(status().isOk).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.data[0].reason").value("운영진 전용 사유"))
        TeamsTable.update({ TeamsTable.id eq 1 }) { it[deletedAt] = LocalDateTime.now() }
        mvc.perform(get(historyUrl).requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L)).andExpect(status().isNotFound)
        mvc.perform(put(url).requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L).contentType(MediaType.APPLICATION_JSON).content("""{"voteStatus":"UNAVAILABLE"}"""))
            .andExpect(status().isNotFound)
        Unit
    }

    @Test
    fun `response source and history roll back together`() {
        val before = tx { saved() }
        assertThrows<IllegalStateException> { tx { proxy(3); error("transaction failure") } }
        tx {
            assertEquals(before, saved())
            assertTrue(service.getParticipationHistory(1, 3, 10).isEmpty())
        }
    }

    @Test
    fun `F01 SQL supports empty install and legacy upgrade preserving unknown origin and existing records in H2 MySQL mode`() {
        val schema = Files.readString(Path.of("src/main/resources/schema.sql"))
        val participantDdl = Regex("CREATE TABLE match_participants \\(.*?;", RegexOption.DOT_MATCHES_ALL).find(schema)!!.value
        val historyDdl = Regex("CREATE TABLE match_participation_histories \\(.*?;", RegexOption.DOT_MATCHES_ALL).find(schema)!!.value
        val upgrade = Files.readString(Path.of("src/main/resources/change_schema.sql")).substringAfter("-- F01 (2026-10-28):")
        for (existing in listOf(false, true)) {
            val isolated = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
            transaction(isolated) {
                maxAttempts = 1
                fun sql(script: String) = script.lineSequence().filterNot { it.trimStart().startsWith("--") }
                    .joinToString("\n").split(';').filter(String::isNotBlank).forEach { exec(it) }
                if (existing) {
                    sql(participantDdl.replace(Regex("(?m)^\\s*participation_source VARCHAR\\(10\\) NULL,\\r?\\n"), ""))
                    exec("INSERT INTO match_participants (match_id, team_member_id, vote_status, actual_participated, goal_count, memo) VALUES (1, 3, 'AVAILABLE', 1, 2, 'preserve')")
                    sql("-- F01 (2026-10-28):$upgrade")
                } else {
                    sql(participantDdl); sql(historyDdl)
                    exec("INSERT INTO match_participants (match_id, team_member_id, vote_status, actual_participated, goal_count, memo) VALUES (1, 3, 'AVAILABLE', 1, 2, 'preserve')")
                }
                val player = participants.selectParticipantsByMatchIds(listOf(1)).single()
                assertNull(player.participationSource)
                assertEquals(2, player.goalCount)
                assertTrue(player.actualParticipated)
                assertEquals("preserve", player.memo)
                assertTrue(participants.selectParticipationHistory(1, 3).isEmpty())
                // A code rollback can leave the nullable column and append-only history in place.
                exec("SELECT vote_status, goal_count, memo FROM match_participants") { result -> assertTrue(result.next()) }
            }
        }
    }
}
