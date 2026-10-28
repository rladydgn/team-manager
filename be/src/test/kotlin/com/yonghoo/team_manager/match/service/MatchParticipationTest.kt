package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.match.controller.MatchController
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.MatchParticipationUpdateRequest
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

class MatchParticipationTest {
    private lateinit var db: Database
    private val participants = MatchParticipantRepository()
    private val matches = MatchRepository()
    private val service = MatchService(participants, matches, TeamRepository(), mock(UserRepository::class.java))
    private fun <T> tx(block: () -> T): T = transaction(db) { block() }

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, MatchesTable, MatchParticipantsTable)
            TeamsTable.insert { it[id] = 1; it[createdByUserId] = 10; it[name] = "본인 투표 팀" }
            for (member in 1L..2L) TeamMembersTable.insert {
                it[id] = member; it[teamId] = 1; it[userId] = member * 10; it[displayName] = "선수 $member"
                it[role] = if (member == 1L) TeamMemberRole.OWNER else TeamMemberRole.MEMBER
            }
            MatchesTable.insert {
                it[id] = 1; it[teamId] = 1; it[createdByUserId] = 10; it[matchType] = MatchType.INTERNAL
                it[matchAt] = LocalDateTime.now().plusDays(2); it[participationDeadlineAt] = LocalDateTime.now().plusDays(1)
            }
            participants.createDefaultParticipants(1, listOf(1, 2))
        }
    }

    @Test
    fun `self vote and memo retain response time and work with or without obsolete metadata`() = transaction(db) {
        service.updateMatchParticipation(1, 20, MatchParticipationUpdateRequest(MatchParticipantStatus.AVAILABLE, "메모"))
        val first = participants.selectParticipantsByMatchIds(listOf(1)).first { it.teamMemberId == 2L }
        service.updateMatchParticipation(1, 20, MatchParticipationUpdateRequest(MatchParticipantStatus.AVAILABLE, "수정"))
        val second = participants.selectParticipantsByMatchIds(listOf(1)).first { it.teamMemberId == 2L }
        assertEquals(first.respondedAt, second.respondedAt)
        assertEquals("수정", second.memo)
        assertFalse(second.actualParticipated); assertEquals(0, second.goalCount)
        // An existing DB may retain the unused F01 column/table; no code reads or writes either.
        exec("ALTER TABLE match_participants ADD COLUMN participation_source VARCHAR(10) NULL")
        exec("CREATE TABLE match_participation_histories (id BIGINT PRIMARY KEY, reason VARCHAR(500))")
        exec("UPDATE match_participants SET participation_source = 'PROXY'")
        exec("INSERT INTO match_participation_histories VALUES (1, 'preserve history')")
        service.updateMatchParticipation(1, 20, MatchParticipationUpdateRequest(MatchParticipantStatus.UNAVAILABLE))
        assertEquals(MatchParticipantStatus.UNAVAILABLE, participants.selectParticipantsByMatchIds(listOf(1)).first { it.teamMemberId == 2L }.voteStatus)
        exec("SELECT reason FROM match_participation_histories") { rows -> assertTrue(rows.next()); assertEquals("preserve history", rows.getString(1)) }
        MatchesTable.update({ MatchesTable.id eq 1 }) { it[participationDeadlineAt] = LocalDateTime.now().minusSeconds(1) }
        assertEquals("MATCH_PARTICIPATION_CLOSED", assertThrows<ApiException> {
            service.updateMatchParticipation(1, 20, MatchParticipationUpdateRequest(MatchParticipantStatus.AVAILABLE))
        }.errorCode.code)
    }

    @Test
    fun `removed proxy and history routes return 404 while authenticated self API remains available`() = tx {
        val mvc = MockMvcBuilders.standaloneSetup(MatchController(service))
            .setControllerAdvice(GlobalExceptionHandler()).setMessageConverters(JacksonJsonHttpMessageConverter()).build()
        for (actor in listOf(10L, 20L)) {
            mvc.perform(put("/matches/1/participants/2/participation").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, actor)
                .contentType(MediaType.APPLICATION_JSON).content("""{"voteStatus":"AVAILABLE"}"""))
                .andExpect(status().isNotFound)
            mvc.perform(get("/matches/1/participants/2/participation-history").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, actor))
                .andExpect(status().isNotFound)
        }
        mvc.perform(put("/matches/1/participation").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 20L)
            .contentType(MediaType.APPLICATION_JSON).content("""{"voteStatus":"AVAILABLE","memo":"본인"}"""))
            .andExpect(status().isOk).andExpect(jsonPath("$.data.teamMemberId").value(2))
            .andExpect(jsonPath("$.data.participationSource").doesNotExist())
        assertEquals(MatchParticipantStatus.PENDING, participants.selectParticipantsByMatchIds(listOf(1)).first { it.teamMemberId == 1L }.voteStatus)
        assertNull(matches.selectMatchById(1)?.teamScore)
    }
}
