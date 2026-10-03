package com.yonghoo.team_manager.team.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import java.nio.file.Path
import javax.imageio.ImageIO

class TeamLogoStorageTest {
    @TempDir
    lateinit var folder: Path
    private val processor = TeamLogoImageProcessor()

    @Test
    fun `로고는 비율과 투명 여백을 유지한 256px PNG로 저장하고 경로는 재시작 후에도 읽힌다`() {
        val storage = TeamLogoStorage(folder.toString(), processor)
        val url = storage.save(png(512, 256))
        val bytes = TeamLogoStorage(folder.toString(), processor).read(url.substringAfterLast('/'))
        val image = ImageIO.read(ByteArrayInputStream(bytes))
        assertEquals(256, image.width)
        assertEquals(256, image.height)
        assertEquals(0, image.getRGB(128, 0) ushr 24)
        assertEquals(Color.RED.rgb, image.getRGB(128, 128))
        assertTrue(bytes.size < 1024 * 1024)
    }

    @Test
    fun `1MB 초과와 잘못된 파일 및 허용하지 않는 픽셀 크기를 거절한다`() {
        val files = listOf(
            MockMultipartFile("logo", "large.png", "image/png", ByteArray(1024 * 1024 + 1)),
            MockMultipartFile("logo", "fake.png", "image/png", "not an image".toByteArray()),
            MockMultipartFile("logo", "logo.svg", "image/svg+xml", "<svg/>".toByteArray()),
            png(32, 64), png(2049, 64),
        )
        for (file in files) {
            assertEquals(TeamErrorCode.INVALID_TEAM_LOGO, assertThrows<ApiException> {
                processor.normalize(file)
            }.errorCode)
        }
    }

    @Test
    fun `잘못된 파일 이름과 없는 로고는 404용 오류를 반환한다`() {
        val storage = TeamLogoStorage(folder.toString(), processor)
        for (name in listOf("../outside.png", "missing.png", "00000000-0000-0000-0000-000000000000.png")) {
            assertEquals(TeamErrorCode.TEAM_LOGO_NOT_FOUND, assertThrows<ApiException> {
                storage.read(name)
            }.errorCode)
        }
    }

    @Test
    fun `팀 저장이 롤백되면 업로드 파일도 제거한다`() {
        TransactionSynchronizationManager.initSynchronization()
        try {
            val storage = TeamLogoStorage(folder.toString(), processor)
            val url = storage.save(png(64, 64))
            val path = folder.resolve(url.substringAfterLast('/'))
            assertTrue(Files.exists(path))
            TransactionSynchronizationManager.getSynchronizations().forEach {
                it.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK)
            }
            assertFalse(Files.exists(path))
        } finally {
            TransactionSynchronizationManager.clearSynchronization()
        }
    }

    private fun png(width: Int, height: Int): MockMultipartFile {
        val image = BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB)
        val graphics = image.createGraphics()
        graphics.color = Color.RED
        graphics.fillRect(0, 0, width, height)
        graphics.dispose()
        val bytes = ByteArrayOutputStream()
        ImageIO.write(image, "png", bytes)
        return MockMultipartFile("logo", "logo.png", "image/png", bytes.toByteArray())
    }
}
