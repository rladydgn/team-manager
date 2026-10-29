package com.yonghoo.team_manager.team.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.team.controller.TeamController
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.dto.*
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.jetbrains.exposed.v1.jdbc.Database
import org.jetbrains.exposed.v1.jdbc.SchemaUtils
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.*
import java.math.BigDecimal
import java.util.UUID
import org.springframework.http.MediaType
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule

class TeamMemberPlayerProfileTest {
    private lateinit var db: Database
    private val repository = TeamRepository()
    private val matches = mock(MatchRepository::class.java)
    private val service = TeamService(repository, mock(UserRepository::class.java), ObjectMapper(), matches,
        mock(MatchParticipantRepository::class.java), mock(TeamLogoStorage::class.java))
    private var teamId = 0L
    private var memberId = 0L
    private fun <T> tx(block: () -> T): T = transaction(db = db) { block() }

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable)
            teamId = repository.createTeam(10, TeamCreateRequest("선수 정보 테스트")).id
            repository.createTeamMember(teamId, 10, "팀장", TeamMemberRole.OWNER)
            repository.createTeamMember(teamId, 20, "부팀장", TeamMemberRole.SUB_MANAGER)
            memberId = repository.createTeamMember(teamId, 30, "팀원", TeamMemberRole.MEMBER).id
        }
        `when`(matches.selectMatchesByTeamId(teamId)).thenReturn(emptyList())
    }

    @Test
    fun `기존 선수는 미설정이며 팀장과 부팀장이 모든 포지션과 경계 등번호를 저장한다`() {
        tx {
            val original = repository.selectTeamMemberById(teamId, memberId)!!
            assertNull(original.mainPosition)
            assertNull(original.jerseyNumber)
        }
        for ((index, position) in PlayerPosition.entries.withIndex()) {
            val number = if (index % 2 == 0) 0 else 99
            tx { service.updateTeamMemberPlayerProfile(teamId, memberId, if (index % 2 == 0) 10 else 20,
                TeamMemberPlayerProfileRequest(position, BigDecimal(number))) }
            tx {
                val saved = service.getTeamMembers(teamId, 30).single { it.id == memberId }
                assertEquals(position, saved.mainPosition)
                assertEquals(number, saved.jerseyNumber)
            }
        }
    }

    @Test
    fun `주포지션과 등번호를 각각 설정하거나 null로 지울 수 있다`() {
        for (request in listOf(TeamMemberPlayerProfileRequest(PlayerPosition.CB),
            TeamMemberPlayerProfileRequest(jerseyNumber = BigDecimal.TEN), TeamMemberPlayerProfileRequest())) {
            tx { service.updateTeamMemberPlayerProfile(teamId, memberId, 10, request) }
            tx {
                val saved = repository.selectTeamMemberById(teamId, memberId)!!
                assertEquals(request.mainPosition, saved.mainPosition)
                assertEquals(request.jerseyNumber?.toInt(), saved.jerseyNumber)
            }
        }
    }

    @Test
    fun `신규 팀원과 용병에 같은 등번호를 저장할 수 있다`() {
        for (role in listOf(TeamMemberRole.MEMBER, TeamMemberRole.GUEST)) {
            val created = tx { service.addTeamMember(teamId, 20, TeamMemberCreateRequest("선수", role, PlayerPosition.GK, BigDecimal.TEN)) }
            tx {
                val saved = repository.selectTeamMemberById(teamId, created.id)!!
                assertEquals(10, saved.jerseyNumber)
                assertEquals(PlayerPosition.GK, saved.mainPosition)
            }
        }
        val omitted = tx { service.addTeamMember(teamId, 10, TeamMemberCreateRequest("미설정", TeamMemberRole.GUEST)) }
        assertNull(omitted.mainPosition)
        assertNull(omitted.jerseyNumber)
    }

    @Test
    fun `범위 밖 숫자와 소수는 등록 및 수정 시 거절한다`() {
        for (number in listOf("-1", "100", "7.5", "999999999999999999999999")) {
            assertEquals(TeamErrorCode.INVALID_JERSEY_NUMBER, assertThrows<ApiException> {
                tx { service.updateTeamMemberPlayerProfile(teamId, memberId, 10,
                    TeamMemberPlayerProfileRequest(PlayerPosition.MF, BigDecimal(number))) }
            }.errorCode)
            assertEquals(TeamErrorCode.INVALID_JERSEY_NUMBER, assertThrows<ApiException> {
                tx { service.addTeamMember(teamId, 10, TeamMemberCreateRequest("선수", TeamMemberRole.MEMBER,
                    jerseyNumber = BigDecimal(number))) }
            }.errorCode)
        }
    }

    @Test
    fun `일반 팀원과 비팀원은 수정할 수 없다`() {
        for (actor in listOf(30L, 999L)) assertEquals(TeamErrorCode.TEAM_UPDATE_FORBIDDEN, assertThrows<ApiException> {
            tx { service.updateTeamMemberPlayerProfile(teamId, memberId, actor, TeamMemberPlayerProfileRequest(PlayerPosition.FW)) }
        }.errorCode)
    }

    @Test
    fun `다른 팀과 탈퇴한 선수는 수정할 수 없다`() {
        val other = tx { repository.createTeamMember(teamId + 1, null, "다른 팀", TeamMemberRole.GUEST).id }
        tx { repository.updateTeamMemberStatus(memberId, TeamMemberStatus.LEFT) }
        for (target in listOf(memberId, other)) assertEquals(TeamErrorCode.TEAM_MEMBER_NOT_FOUND, assertThrows<ApiException> {
            tx { service.updateTeamMemberPlayerProfile(teamId, target, 10, TeamMemberPlayerProfileRequest(PlayerPosition.FW)) }
        }.errorCode)
    }

    private fun mvc() = MockMvcBuilders.standaloneSetup(TeamController(service))
        .setControllerAdvice(GlobalExceptionHandler())
        .setMessageConverters(JacksonJsonHttpMessageConverter(
            JsonMapper.builder().addModule(KotlinModule.Builder().build()).build(),
        )).build()

    @Test
    fun `API는 숫자 0과 null을 그대로 저장하고 응답한다`() {
        val mvc = mvc()
        tx {
            mvc.perform(put("/teams/$teamId/members/$memberId/player-profile")
                .requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L).contentType(MediaType.APPLICATION_JSON)
                .content("""{"mainPosition":"GK","jerseyNumber":0}"""))
                .andExpect(status().isOk).andExpect(jsonPath("$.data.mainPosition").value("GK"))
                .andExpect(jsonPath("$.data.jerseyNumber").value(0))
            mvc.perform(put("/teams/$teamId/members/$memberId/player-profile")
                .requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L).contentType(MediaType.APPLICATION_JSON)
                .content("""{"mainPosition":null,"jerseyNumber":null}"""))
                .andExpect(status().isOk)
            assertNull(repository.selectTeamMemberById(teamId, memberId)!!.jerseyNumber)
            assertNull(repository.selectTeamMemberById(teamId, memberId)!!.mainPosition)
        }
    }

    @Test
    fun `API는 잘못된 포지션과 소수를 거부하고 인증 정보가 없으면 401을 반환한다`() {
        val mvc = mvc()
        for (body in listOf("""{"mainPosition":"INVALID"}""", """{"jerseyNumber":7.5}""")) tx {
            mvc.perform(put("/teams/$teamId/members/$memberId/player-profile")
                .requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest)
        }
        mvc.perform(put("/teams/$teamId/members/$memberId/player-profile")
            .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isUnauthorized)
    }
}
