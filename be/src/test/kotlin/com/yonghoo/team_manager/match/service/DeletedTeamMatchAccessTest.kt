package com.yonghoo.team_manager.match.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.match.controller.FormationRequestExceptionHandler
import com.yonghoo.team_manager.match.controller.MatchController
import com.yonghoo.team_manager.match.controller.MatchFormationController
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.FormationPlacementRequest
import com.yonghoo.team_manager.match.dto.MatchFormationRequest
import com.yonghoo.team_manager.match.repository.*
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.team.service.TeamLogoStorage
import com.yonghoo.team_manager.team.service.TeamService
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.repository.UserRepository
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.junit.jupiter.params.provider.ValueSource
import org.mockito.Mockito.mock
import org.springframework.http.MediaType
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import java.time.LocalDateTime
import java.util.UUID

class DeletedTeamMatchAccessTest {
    private lateinit var db: Database
    private lateinit var mvc: MockMvc
    private var formationId = 0L
    private val teams = TeamRepository()
    private val matches = MatchRepository()
    private val participants = MatchParticipantRepository()
    private val users = mock(UserRepository::class.java)
    private val formations = MatchFormationService(MatchFormationRepository())
    private val teamService = TeamService(teams, users, ObjectMapper(), matches, participants, mock(TeamLogoStorage::class.java))
    private fun <T> tx(block: () -> T): T = transaction(db) { block() }

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        mvc = MockMvcBuilders.standaloneSetup(
            MatchController(MatchService(participants, matches, teams, users)),
            MatchFormationController(formations),
        ).setControllerAdvice(FormationRequestExceptionHandler(), GlobalExceptionHandler())
            .setMessageConverters(JacksonJsonHttpMessageConverter(JsonMapper.builder()
                .addModule(KotlinModule.Builder().build()).build()))
            .build()
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, TeamHistoriesTable, MatchesTable,
                MatchParticipantsTable, MatchFormationsTable, MatchFormationPlacementsTable)
            TeamsTable.insert { it[id] = 1; it[createdByUserId] = 10; it[name] = "접근 검증 팀" }
            TeamMembersTable.insert {
                it[id] = 1; it[teamId] = 1; it[userId] = 10; it[displayName] = "마지막 팀장"; it[role] = TeamMemberRole.OWNER
            }
            val now = LocalDateTime.now()
            for (id in 1L..2L) {
                MatchesTable.insert {
                    it[this.id] = id; it[teamId] = 1; it[matchType] = MatchType.INTERNAL; it[createdByUserId] = 10
                    it[matchAt] = if (id == 1L) now.plusDays(2) else now.minusDays(2)
                    it[participationDeadlineAt] = if (id == 1L) now.plusDays(1) else now.minusDays(3)
                    it[publicNote] = "보존할 경기 기록"; it[managerNote] = "운영진 전용 기록"
                }
                MatchParticipantsTable.insert {
                    it[matchId] = id; it[teamMemberId] = 1; it[teamSide] = MatchTeamSide.HOME
                    it[voteStatus] = MatchParticipantStatus.AVAILABLE; it[memo] = "보존할 참가 메모"
                }
            }
            formationId = formations.save(1, 10, MatchFormationRequest("1쿼터", "HOME", "4-4-2",
                listOf(FormationPlacementRequest("GK", 1)))).id
        }
    }

    @ParameterizedTest
    @ValueSource(strings = ["team-deleted", "inactive-only", "deleted-at-only"])
    fun `deleted or inactive parent blocks every match endpoint and preserves stored data`(state: String) {
        tx {
            when (state) {
                "team-deleted" -> teamService.deleteTeam(1, 10)
                "inactive-only" -> TeamsTable.update({ TeamsTable.id eq 1 }) { it[status] = TeamStatus.INACTIVE }
                "deleted-at-only" -> TeamsTable.update({ TeamsTable.id eq 1 }) { it[deletedAt] = LocalDateTime.now() }
            }
        }
        tx {
            // Authentication and the owner's ACTIVE membership remain after team deletion.
            assertTrue(teams.existsActiveMember(1, 10))
            assertNotNull(matches.selectMatchById(1))
            val before = storedMatchData()
            for (request in readRequests() + listOf(participationRequest()) + writeRequests()) {
                mvc.perform(authenticated(request)).andExpect(status().isNotFound)
                    .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
            }
            assertEquals(before, storedMatchData())
        }
    }

    @ParameterizedTest
    @EnumSource(TeamMemberRole::class, names = ["OWNER", "SUB_MANAGER"])
    fun `active team managers retain read and write access`(role: TeamMemberRole) = tx {
        TeamMembersTable.update({ TeamMembersTable.id eq 1 }) { it[this.role] = role }
        for (request in readRequests() + listOf(participationRequest()) + writeRequests()) {
            mvc.perform(authenticated(request)).andExpect(status().is2xxSuccessful)
        }
    }

    @ParameterizedTest
    @EnumSource(TeamMemberRole::class, names = ["MEMBER", "GUEST"])
    fun `active members can read and vote but cannot manage matches`(role: TeamMemberRole) = tx {
        TeamMembersTable.update({ TeamMembersTable.id eq 1 }) { it[this.role] = role }
        for (request in readRequests()) mvc.perform(authenticated(request)).andExpect(status().isOk)
        mvc.perform(authenticated(participationRequest())).andExpect(status().isOk)
        for (request in writeRequests()) {
            mvc.perform(authenticated(request)).andExpect(status().isNotFound)
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
        }
    }

    @Test
    fun `outsiders still cannot read or write active team matches`() = tx {
        for (request in readRequests() + listOf(participationRequest()) + writeRequests()) {
            mvc.perform(request.requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 99L))
                .andExpect(status().isNotFound).andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"))
        }
    }

    private fun authenticated(request: MockHttpServletRequestBuilder) = request.requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L)

    private fun readRequests() = listOf(
        get("/matches/1"), get("/matches/1/participants"), get("/matches/1/notes"),
        get("/matches/1/participant-sides"), get("/matches/1/formations"),
    )

    private fun participationRequest() =
        put("/matches/1/participation").json("""{"voteStatus":"AVAILABLE","memo":"변경"}""")

    private fun writeRequests(): List<MockHttpServletRequestBuilder> {
        val formation = """{"title":"수정","side":"HOME","templateId":"4-4-2","placements":[]}"""
        return listOf(
            put("/matches/1/notes/PUBLIC").json("""{"content":"변경"}"""),
            put("/matches/1/notes/MANAGERS").json("""{"content":"변경"}"""),
            put("/matches/2/record").json("""{"opponentScore":0,"participants":[{"teamMemberId":1,"actualParticipated":true,"late":false,"goalCount":1,"assistCount":0,"cleanSheetCount":0}]}"""),
            put("/matches/2/historical-participants").json("""{"participants":[{"teamMemberId":1,"voteStatus":"AVAILABLE"}]}"""),
            patch("/matches/1/participant-sides").json("""{"version":1,"assignments":[{"teamMemberId":1,"side":"AWAY"}]}"""),
            post("/matches/1/formations").json(formation),
            put("/matches/1/formations/$formationId").json(formation.dropLast(1) + ",\"version\":1}"),
            delete("/matches/1/formations/$formationId").param("version", "2"),
        )
    }

    private fun MockHttpServletRequestBuilder.json(body: String) = contentType(MediaType.APPLICATION_JSON).content(body)

    private fun storedMatchData(): Map<String, List<Map<String, Any?>>> =
        listOf<Table>(MatchesTable, MatchParticipantsTable, MatchFormationsTable, MatchFormationPlacementsTable).associate { table ->
            table.tableName to table.selectAll().map { row -> table.columns.associate { column -> column.name to row[column] } }
        }
}
