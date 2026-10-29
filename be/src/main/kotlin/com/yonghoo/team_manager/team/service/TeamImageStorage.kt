package com.yonghoo.team_manager.team.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager
import org.springframework.web.multipart.MultipartFile
import java.io.ByteArrayInputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.util.UUID
import javax.imageio.ImageIO
import javax.imageio.stream.MemoryCacheImageInputStream

data class ValidatedTeamImage(val bytes: ByteArray, val originalFileName: String)

@Service
class TeamImageStorage(@Value("\${app.team-image.storage-path:\${user.home}/files}") storagePath: String) {
    private val root = Path.of(storagePath).toAbsolutePath().normalize()
    private val logger = LoggerFactory.getLogger(javaClass)

    fun validate(file: MultipartFile): ValidatedTeamImage {
        val name = file.originalFilename.orEmpty().replace('\\', '/').substringAfterLast('/')
        if (name.length !in 1..255 || name.any { it.isISOControl() } || !name.endsWith(".jpg", true) ||
            file.isEmpty || file.size > MAX_SIZE || file.contentType != "image/jpeg") invalid()
        try {
            val bytes = file.inputStream.use { it.readNBytes(MAX_SIZE + 1) }
            if (bytes.isEmpty() || bytes.size > MAX_SIZE) invalid()
            MemoryCacheImageInputStream(ByteArrayInputStream(bytes)).use { input ->
                val readers = ImageIO.getImageReaders(input)
                if (!readers.hasNext()) invalid()
                val reader = readers.next()
                try {
                    if (!reader.formatName.equals("jpeg", true)) invalid()
                    reader.input = input
                    val width = reader.getWidth(0)
                    val height = reader.getHeight(0)
                    if (width <= 0 || height <= 0) invalid()
                    // Validate decoding with bounded memory, while retaining the original JPG and its aspect ratio.
                    val step = maxOf(1, (maxOf(width, height) + 1023) / 1024)
                    val params = reader.defaultReadParam.apply { setSourceSubsampling(step, step, 0, 0) }
                    reader.read(0, params)?.flush() ?: invalid()
                } finally { reader.dispose() }
            }
            return ValidatedTeamImage(bytes, name)
        } catch (error: ApiException) { throw error }
        catch (_: Exception) { invalid() }
    }

    fun save(teamId: Long, image: ValidatedTeamImage): String {
        val relative = "team-images/$teamId/${UUID.randomUUID()}.jpg"
        val path = resolve(relative)
        var created = false
        try {
            Files.createDirectories(path.parent)
            Files.newOutputStream(path, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE).use {
                created = true
                it.write(image.bytes)
            }
            // Register before returning so a failed DB insert or commit also removes this file.
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(object : TransactionSynchronization {
                    override fun afterCompletion(status: Int) {
                        if (status != TransactionSynchronization.STATUS_COMMITTED) cleanup(relative)
                    }
                })
            }
            return relative
        } catch (error: Exception) {
            if (created) cleanup(relative)
            logger.error("Failed to save team image", error)
            throw ApiException(TeamErrorCode.TEAM_IMAGE_STORAGE_FAILED)
        }
    }

    fun read(relative: String): ByteArray {
        try {
            val path = resolve(relative)
            if (!Files.isRegularFile(path)) throw ApiException(TeamErrorCode.TEAM_IMAGE_NOT_FOUND)
            return Files.readAllBytes(path)
        } catch (error: ApiException) { throw error }
        catch (_: Exception) { throw ApiException(TeamErrorCode.TEAM_IMAGE_NOT_FOUND) }
    }

    fun cleanup(relative: String) {
        try { Files.deleteIfExists(resolve(relative)) }
        catch (error: Exception) { logger.warn("Failed to clean up uncommitted team image", error) }
    }

    private fun resolve(relative: String): Path {
        if (!PATH.matches(relative)) throw ApiException(TeamErrorCode.TEAM_IMAGE_NOT_FOUND)
        val path = root.resolve(relative).normalize()
        if (!path.startsWith(root)) throw ApiException(TeamErrorCode.TEAM_IMAGE_NOT_FOUND)
        return path
    }

    private fun invalid(): Nothing = throw ApiException(TeamErrorCode.INVALID_TEAM_IMAGE)

    companion object {
        const val MAX_SIZE = 5 * 1024 * 1024
        private val PATH = Regex("^team-images/[1-9][0-9]*/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg$")
    }
}
