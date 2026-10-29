package com.yonghoo.team_manager.team.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.team.controller.TeamImageController
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.dto.*
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.*
import com.yonghoo.team_manager.user.auth.*
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.io.TempDir
import org.mockito.Mockito.mock
import org.springframework.http.MediaType
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter
import org.springframework.http.converter.ByteArrayHttpMessageConverter
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import jakarta.servlet.http.Cookie
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.imageio.ImageIO

class TeamImageTest {
    @TempDir lateinit var folder: Path
    private lateinit var db: Database
    private lateinit var storage: TeamImageStorage
    private lateinit var service: TeamImageService
    private val images = TeamImageRepository()
    private val teams = TeamRepository()
    private var teamId = 0L
    private fun <T> tx(block: () -> T): T = transaction(db) { maxAttempts = 1; block() }

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000", driver = "org.h2.Driver")
        storage = TeamImageStorage(folder.toString())
        service = TeamImageService(images, teams, storage)
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, TeamImagesTable)
            teamId = teams.createTeam(10, TeamCreateRequest("사진 테스트")).id
            teams.createTeamMember(teamId, 10, "팀장", TeamMemberRole.OWNER)
            teams.createTeamMember(teamId, 20, "부팀장", TeamMemberRole.SUB_MANAGER)
            teams.createTeamMember(teamId, 30, "팀원", TeamMemberRole.MEMBER)
        }
    }

    @Test
    fun `경로와 원본명을 보존하고 정렬 충돌 및 삭제 후 공개 조회를 보호한다`() {
        val first = tx { service.upload(teamId, 10, jpg("C:\\fakepath\\친선전.JPG")) }.single()
        val second = tx { service.upload(teamId, 20, jpg("친선전.JPG")) }.last()
        assertEquals("친선전.JPG", first.originalFileName)
        assertNotEquals(first.url, second.url)
        val original = tx { images.list(teamId).first() }
        assertTrue(original.imagePath.startsWith("team-images/$teamId/"))
        assertTrue(Files.exists(folder.resolve(original.imagePath)))
        assertArrayEquals(jpg().bytes, tx { service.read(teamId, first.id) })
        assertEquals(listOf(second.id, first.id), tx { service.reorder(teamId, 10,
            TeamImageOrderRequest(listOf(second.id, first.id), listOf(first.id, second.id))) }.map { it.id })
        assertEquals(TeamErrorCode.TEAM_IMAGES_CHANGED, assertThrows<ApiException> { tx {
            service.reorder(teamId, 20, TeamImageOrderRequest(listOf(first.id, second.id), listOf(first.id, second.id)))
        } }.errorCode)
        assertEquals(TeamErrorCode.INVALID_TEAM_IMAGE_ORDER, assertThrows<ApiException> { tx {
            service.reorder(teamId, 10, TeamImageOrderRequest(listOf(first.id, first.id), listOf(second.id, first.id)))
        } }.errorCode)
        tx { service.delete(teamId, first.id, 20) }
        assertTrue(Files.exists(folder.resolve(original.imagePath)))
        assertEquals(listOf(second.id), tx { service.list(teamId) }.map { it.id })
        assertThrows<ApiException> { tx { service.read(teamId, first.id) } }
        assertThrows<ApiException> { tx { service.read(teamId + 1, second.id) } }
        tx { teams.softDeleteTeam(teamId) }
        assertThrows<ApiException> { tx { service.list(teamId) } }
        assertThrows<ApiException> { tx { service.read(teamId, second.id) } }
    }

    @Test
    fun `JPG 실형식과 5MB 경계 및 원본명과 경로를 검사한다`() {
        val bytes = jpg().bytes
        assertEquals(TeamImageStorage.MAX_SIZE, storage.validate(MockMultipartFile("image", "a.jpg", "image/jpeg", bytes.copyOf(TeamImageStorage.MAX_SIZE))).bytes.size)
        val invalid = listOf(
            MockMultipartFile("image", "a.jpg", "image/jpeg", bytes.copyOf(TeamImageStorage.MAX_SIZE + 1)),
            jpg("a.jpeg"), jpg("a.png"), jpg("a\n.jpg"), jpg("x".repeat(256) + ".jpg"),
            MockMultipartFile("image", "a.jpg", "image/jpeg", byteArrayOf()),
            MockMultipartFile("image", "a.jpg", "image/jpeg", "not an image".toByteArray()),
            MockMultipartFile("image", "a.jpg", "image/png", bytes),
            MockMultipartFile("image", "a.jpg", "image/jpeg", encoded("png")),
        )
        invalid.forEach { assertEquals(TeamErrorCode.INVALID_TEAM_IMAGE,
            assertThrows<ApiException> { storage.validate(it) }.errorCode) }
        assertThrows<ApiException> { storage.read("../outside.jpg") }
        assertThrows<ApiException> { storage.read("team-images/1/missing.jpg") }
    }

    @Test
    fun `일반 팀원과 탈퇴 운영진은 등록 삭제 정렬을 할 수 없다`() {
        val image = tx { service.upload(teamId, 10, jpg()) }.single()
        for (actor in listOf(30L, 999L)) {
            assertThrows<ApiException> { tx { service.upload(teamId, actor, jpg()) } }
            assertThrows<ApiException> { tx { service.delete(teamId, image.id, actor) } }
            assertThrows<ApiException> { tx { service.reorder(teamId, actor, TeamImageOrderRequest(listOf(image.id), listOf(image.id))) } }
        }
        tx {
            val member = teams.selectMembersByTeamId(teamId).single { it.userId == 20L }
            teams.updateTeamMemberStatus(member.id, TeamMemberStatus.LEFT)
        }
        assertThrows<ApiException> { tx { service.upload(teamId, 20, jpg()) } }
        assertEquals(1, tx { service.list(teamId) }.size)
    }

    @Test
    fun `마지막 한 자리의 동시 등록은 하나만 성공하며 삭제하면 다시 등록할 수 있다`() {
        repeat(2) { tx { service.upload(teamId, 10, jpg()) } }
        val start = CountDownLatch(1)
        val pool = Executors.newFixedThreadPool(2)
        try {
            val futures = (1..2).map { pool.submit<String> {
                start.await(5, TimeUnit.SECONDS)
                try { tx { service.upload(teamId, 10, jpg()) }; "OK" }
                catch (error: ApiException) { error.errorCode.code }
            } }
            start.countDown()
            assertEquals(listOf("OK", "TEAM_IMAGE_LIMIT_REACHED"), futures.map { it.get(20, TimeUnit.SECONDS) }.sorted())
            val current = tx { service.list(teamId) }
            assertEquals(3, current.size)
            Files.walk(folder).use { paths -> assertEquals(3L, paths.filter(Files::isRegularFile).count()) }
            tx { service.delete(teamId, current.first().id, 10) }
            assertEquals(3, tx { service.upload(teamId, 20, jpg()) }.size)
        } finally { pool.shutdownNow() }
    }

    @Test
    fun `롤백 신규 파일을 정리하고 DB 쓰기 실패도 파일을 남기지 않는다`() {
        TransactionSynchronizationManager.initSynchronization()
        try {
            val path = storage.save(teamId, storage.validate(jpg()))
            assertTrue(Files.exists(folder.resolve(path)))
            TransactionSynchronizationManager.getSynchronizations().forEach { it.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK) }
            assertFalse(Files.exists(folder.resolve(path)))
        } finally { TransactionSynchronizationManager.clearSynchronization() }
        val failing = mock(TeamImageRepository::class.java)
        org.mockito.Mockito.`when`(failing.lockTeam(teamId)).thenReturn(true)
        org.mockito.Mockito.`when`(failing.managerRole(teamId, 10)).thenReturn(TeamMemberRole.OWNER)
        org.mockito.Mockito.`when`(failing.list(teamId, true)).thenReturn(emptyList())
        org.mockito.Mockito.doThrow(IllegalStateException("DB failed")).`when`(failing)
            .create(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt())
        assertThrows<IllegalStateException> { tx { TeamImageService(failing, teams, storage).upload(teamId, 10, jpg()) } }
        Files.walk(folder).use { paths -> assertEquals(0L, paths.filter(Files::isRegularFile).count()) }
    }

    @Test
    fun `공개 HTTP 조회와 파일은 쿠키 없이 허용하고 쓰기는 인증 및 운영진만 허용한다`() {
        val interceptor = JwtAuthenticationInterceptor(mock(JwtTokenProvider::class.java), ObjectMapper())
        val mvc = MockMvcBuilders.standaloneSetup(TeamImageController(service))
            .addInterceptors(interceptor).setControllerAdvice(GlobalExceptionHandler())
            .setMessageConverters(ByteArrayHttpMessageConverter(), JacksonJsonHttpMessageConverter(JsonMapper.builder().addModule(KotlinModule.Builder().build()).build())).build()
        val image = tx { service.upload(teamId, 10, jpg()) }.single()
        tx {
            mvc.perform(get("/teams/$teamId/images")).andExpect(status().isOk)
                .andExpect(jsonPath("$.data[0].originalFileName").value("photo.jpg"))
                .andExpect(jsonPath("$.data[0].imagePath").doesNotExist())
            mvc.perform(get(image.url).cookie(Cookie(ACCESS_TOKEN_COOKIE_NAME, "expired"))).andExpect(status().isOk)
                .andExpect(content().contentType(MediaType.IMAGE_JPEG)).andExpect(header().string("Cache-Control", "no-store"))
            mvc.perform(delete("/teams/$teamId/images/${image.id}")).andExpect(status().isUnauthorized)
            mvc.perform(delete("/teams/$teamId/images/${image.id}").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 30L))
                .andExpect(status().isUnauthorized)
        }
        // Controller/service permission response with an already authenticated actor.
        val authenticated = MockMvcBuilders.standaloneSetup(TeamImageController(service))
            .setControllerAdvice(GlobalExceptionHandler())
            .setMessageConverters(ByteArrayHttpMessageConverter(), JacksonJsonHttpMessageConverter(JsonMapper.builder().addModule(KotlinModule.Builder().build()).build())).build()
        tx {
            authenticated.perform(multipart("/teams/$teamId/images").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L))
                .andExpect(status().isBadRequest)
            authenticated.perform(multipart("/teams/$teamId/images").file(jpg()).requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 20L))
                .andExpect(status().isOk).andExpect(jsonPath("$.data.length()").value(2))
            authenticated.perform(delete("/teams/$teamId/images/${image.id}").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 30L))
                .andExpect(status().isNotFound)
            authenticated.perform(delete("/teams/$teamId/images/${image.id}").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 20L))
                .andExpect(status().isOk)
            mvc.perform(get(image.url)).andExpect(status().isNotFound)
        }
    }

    @Test
    fun `신규와 기존용 실제 이미지 DDL로 생성한 테이블에서 ORM이 동작한다`() {
        val schema = Files.readString(Path.of("src/main/resources/schema.sql"))
        val create = Regex("CREATE TABLE team_images \\(.*?;", RegexOption.DOT_MATCHES_ALL).find(schema)!!.value
        val change = Files.readString(Path.of("src/main/resources/change_schema.sql"))
            .substringAfter("-- Team images (2026-10-30):").substringAfter('\n')
        for (ddl in listOf(create, change)) {
            val isolated = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
            transaction(isolated) {
                ddl.lineSequence().filterNot { it.trimStart().startsWith("--") }.joinToString("\n")
                    .split(';').filter(String::isNotBlank).forEach { exec(it) }
                val id = images.create(1, 10, "team-images/1/test.jpg", "원본.jpg", 50, 0)
                assertEquals("원본.jpg", images.list(1).single().originalFileName)
                images.delete(1, id)
                assertTrue(images.list(1).isEmpty())
            }
        }
    }

    private fun encoded(format: String): ByteArray = ByteArrayOutputStream().use { bytes ->
        val image = BufferedImage(120, 80, BufferedImage.TYPE_INT_RGB)
        ImageIO.write(image, format, bytes)
        image.flush()
        bytes.toByteArray()
    }
    private fun jpg(name: String = "photo.jpg") = MockMultipartFile("image", name, "image/jpeg", encoded("jpg"))
}
