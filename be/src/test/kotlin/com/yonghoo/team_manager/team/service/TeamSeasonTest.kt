package com.yonghoo.team_manager.team.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.dto.*
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.*
import com.yonghoo.team_manager.team.controller.TeamSeasonController
import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import org.springframework.http.MediaType
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.LocalDate
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class TeamSeasonTest {
    private lateinit var db: Database
    private val teams = TeamRepository()
    private val seasons = TeamSeasonRepository()
    private val service = TeamSeasonService(teams, seasons)
    private var teamId = 0L
    private val date = LocalDate.of(2026, 1, 1)
    private fun request(name: String, memo: String? = null) = TeamSeasonCreateRequest(name, date, date.plusMonths(6), memo)
    private fun <T> tx(block: () -> T): T = transaction(db) { maxAttempts = 1; block() }
    private fun create(name: String) = tx { service.createSeason(teamId, 10, request(name)).first { it.name == name } }

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, TeamSeasonsTable)
            teamId = teams.createTeam(10, TeamCreateRequest("시즌 테스트")).id
            teams.createTeamMember(teamId, 10, "팀장", TeamMemberRole.OWNER)
            teams.createTeamMember(teamId, 20, "부팀장", TeamMemberRole.SUB_MANAGER)
            teams.createTeamMember(teamId, 30, "팀원", TeamMemberRole.MEMBER)
        }
    }

    @Test
    fun `메모와 날짜를 수정하고 팀원 조회에 반영하며 잘못된 입력은 보존한다`() {
        val first = create("2026")
        create("2027")
        val memo = "수비수만 클린시트 집계\n수미 포함 여부는 다음 시즌 검토"
        val updated = tx { service.updateSeason(teamId, first.id, 20, request("  봄 시즌  ", "  $memo  ").copy(endDate = date.plusMonths(3))) }.first()
        assertEquals("봄 시즌", updated.name)
        assertEquals(memo, updated.memo)
        assertTrue(updated.isDefault)
        assertEquals(date.plusMonths(3), updated.endDate)
        assertEquals(memo, tx { service.getSeasons(teamId, 30) }.first().memo)
        for (invalid in listOf(request("2027"), request(" "), request("x".repeat(51)), request("봄", "x".repeat(1001)), request("봄").copy(endDate = date.minusDays(1)))) {
            assertThrows<ApiException> { tx { service.updateSeason(teamId, first.id, 10, invalid) } }
        }
        tx { service.updateSeason(teamId, first.id, 10, request("봄", "x".repeat(1000))) }
        assertEquals(1000, tx { service.getSeasons(teamId, 30) }.first().memo!!.length)
        tx { service.updateSeason(teamId, first.id, 10, request("봄", "  ")) }
        assertNull(tx { service.getSeasons(teamId, 30) }.first().memo)
    }

    @Test
    fun `기본 삭제 대체를 검증하고 소프트 삭제 및 마지막 시즌 삭제 후 재생성이 가능하다`() {
        val first = create("봄")
        val second = create("여름")
        for (replacement in listOf(null, first.id, 999L)) {
            assertEquals(TeamErrorCode.INVALID_TEAM_SEASON_REPLACEMENT, assertThrows<ApiException> { tx {
                service.deleteSeason(teamId, first.id, 10, replacement)
            } }.errorCode)
            assertEquals(first.id, tx { service.getSeasons(teamId, 30) }.single { it.isDefault }.id)
        }
        val after = tx { service.deleteSeason(teamId, first.id, 20, second.id) }
        assertEquals(second.id, after.single().id)
        assertTrue(after.single().isDefault)
        tx {
            assertNotNull(TeamSeasonEntity[first.id].deletedAt)
            assertFalse(TeamSeasonEntity[first.id].isDefault)
            assertEquals("봄", TeamSeasonEntity[first.id].name)
        }
        assertThrows<ApiException> { tx { service.setDefault(teamId, first.id, 10) } }
        assertThrows<ApiException> { tx { service.updateOrder(teamId, 10, TeamSeasonOrderUpdateRequest(listOf(first.id, second.id))) } }
        assertTrue(tx { service.deleteSeason(teamId, second.id, 10, null) }.isEmpty())
        assertTrue(create("봄").isDefault)
    }

    @Test
    fun `일반 시즌 삭제는 기본을 보존하고 타팀 삭제 및 비운영진 변경을 차단한다`() {
        val first = create("봄")
        val second = create("여름")
        for (actor in listOf(30L, 999L)) {
            assertThrows<ApiException> { tx { service.updateSeason(teamId, first.id, actor, request("수정")) } }
            assertThrows<ApiException> { tx { service.deleteSeason(teamId, first.id, actor, second.id) } }
        }
        val other = tx { teams.createTeam(10, TeamCreateRequest("다른 팀")).id.also { teams.createTeamMember(it, 10, "팀장", TeamMemberRole.OWNER) } }
        assertThrows<ApiException> { tx { service.updateSeason(other, first.id, 10, request("수정")) } }
        assertThrows<ApiException> { tx { service.deleteSeason(other, first.id, 10, null) } }
        assertThrows<ApiException> { tx { service.deleteSeason(teamId, second.id, 10, first.id) } }
        assertEquals(first.id, tx { service.deleteSeason(teamId, second.id, 10, null) }.single().id)
        assertTrue(tx { service.getSeasons(teamId, 30) }.single().isDefault)
        tx { teams.softDeleteTeam(teamId) }
        assertThrows<ApiException> { tx { service.deleteSeason(teamId, first.id, 10, null) } }
    }

    @Test
    fun `동시 최초 생성과 기본 변경은 기본 시즌 하나를 유지한다`() {
        fun parallel(actions: List<() -> Unit>) {
            val ready = CountDownLatch(1)
            val pool = Executors.newFixedThreadPool(2)
            try {
                val futures = actions.map { action -> pool.submit { ready.await(); action() } }
                ready.countDown()
                futures.forEach { it.get(15, TimeUnit.SECONDS) }
            } finally { pool.shutdownNow() }
        }
        parallel(listOf({ create("봄"); Unit }, { create("여름"); Unit }))
        val initial = tx { service.getSeasons(teamId, 30) }
        assertEquals(2, initial.size)
        assertEquals(1, initial.count { it.isDefault })
        parallel(initial.map { season -> { tx { service.setDefault(teamId, season.id, 10) }; Unit } })
        assertEquals(1, tx { service.getSeasons(teamId, 30) }.count { it.isDefault })
    }

    @Test
    fun `수정 삭제 HTTP 경로와 대체 쿼리 및 인증 권한을 검증한다`() {
        val first = create("봄")
        val second = create("여름")
        val mvc = MockMvcBuilders.standaloneSetup(TeamSeasonController(service))
            .setControllerAdvice(GlobalExceptionHandler())
            .setMessageConverters(JacksonJsonHttpMessageConverter(JsonMapper.builder().addModule(KotlinModule.Builder().build()).build()))
            .build()
        val body = """{"name":"수정","startDate":"2026-01-01","endDate":"2026-03-31","memo":"수미 포함"}"""
        tx {
            mvc.perform(put("/teams/$teamId/seasons/${first.id}").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized)
            mvc.perform(put("/teams/$teamId/seasons/${first.id}").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 30L).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isNotFound)
            mvc.perform(put("/teams/$teamId/seasons/${first.id}").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 20L).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk).andExpect(jsonPath("$.data[0].memo").value("수미 포함"))
            mvc.perform(delete("/teams/$teamId/seasons/${first.id}").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L))
                .andExpect(status().isConflict)
            mvc.perform(delete("/teams/$teamId/seasons/${first.id}").param("replacementSeasonId", second.id.toString()).requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L))
                .andExpect(status().isOk).andExpect(jsonPath("$.data[0].id").value(second.id)).andExpect(jsonPath("$.data[0].isDefault").value(true))
        }
    }

    @Test
    fun `실제 신규 및 기존 DDL에서 메모를 저장하고 기존 시즌을 보존한다`() {
        val schema = Files.readString(Path.of("src/main/resources/schema.sql")).replace("\r\n", "\n")
        val create = Regex("CREATE TABLE team_seasons [(].*?;", RegexOption.DOT_MATCHES_ALL).find(schema)!!.value
        val alter = Files.readString(Path.of("src/main/resources/change_schema.sql")).substringAfter("-- Season memo (2026-11-04):").substringAfter('\n')
        for (upgrade in listOf(false, true)) {
            val isolated = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
            transaction(isolated) {
                maxAttempts = 1
                exec(if (upgrade) create.replace("    memo VARCHAR(1000) NULL,\n", "") else create)
                exec("INSERT INTO team_seasons(team_id, name, start_date, end_date, created_by_user_id) VALUES(1, '기존', '2026-01-01', '2026-12-31', 10)")
                if (upgrade) alter.split(';').filter { it.isNotBlank() }.forEach { exec(it) }
                val old = seasons.selectByTeamId(1).single()
                assertNull(old.memo)
                seasons.update(old.id, old.name, old.startDate, old.endDate, "수미도 포함")
                assertEquals("수미도 포함", seasons.selectByTeamId(1).single().memo)
            }
        }
    }
}
