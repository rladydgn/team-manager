package com.yonghoo.team_manager.team.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.awt.RenderingHints
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO
import javax.imageio.stream.MemoryCacheImageInputStream
import kotlin.math.roundToInt

@Component
class TeamLogoImageProcessor {
    fun normalize(file: MultipartFile): ByteArray {
        if (file.isEmpty || file.size > 1024 * 1024 ||
            file.contentType !in setOf("image/png", "image/jpeg")
        ) throw ApiException(TeamErrorCode.INVALID_TEAM_LOGO)

        try {
            MemoryCacheImageInputStream(ByteArrayInputStream(file.bytes)).use { input ->
                val readers = ImageIO.getImageReaders(input)
                if (!readers.hasNext()) throw ApiException(TeamErrorCode.INVALID_TEAM_LOGO)
                val reader = readers.next()
                try {
                    if (reader.formatName.lowercase() !in setOf("png", "jpeg")) {
                        throw ApiException(TeamErrorCode.INVALID_TEAM_LOGO)
                    }
                    reader.input = input
                    val width = reader.getWidth(0)
                    val height = reader.getHeight(0)
                    // 압축된 파일 크기가 작아도 과도한 픽셀을 디코딩하지 않습니다.
                    if (width !in 64..2048 || height !in 64..2048) {
                        throw ApiException(TeamErrorCode.INVALID_TEAM_LOGO)
                    }
                    val original = reader.read(0)
                    val output = BufferedImage(256, 256, BufferedImage.TYPE_INT_ARGB)
                    val ratio = minOf(256.0 / width, 256.0 / height)
                    val targetWidth = (width * ratio).roundToInt().coerceAtLeast(1)
                    val targetHeight = (height * ratio).roundToInt().coerceAtLeast(1)
                    val graphics = output.createGraphics()
                    try {
                        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC)
                        graphics.drawImage(original, (256 - targetWidth) / 2, (256 - targetHeight) / 2, targetWidth, targetHeight, null)
                    } finally {
                        graphics.dispose()
                        original.flush()
                    }
                    return ByteArrayOutputStream().use { bytes ->
                        ImageIO.write(output, "png", bytes)
                        output.flush()
                        bytes.toByteArray()
                    }
                } finally {
                    reader.dispose()
                }
            }
        } catch (error: ApiException) {
            throw error
        } catch (_: Exception) {
            throw ApiException(TeamErrorCode.INVALID_TEAM_LOGO)
        }
    }
}
