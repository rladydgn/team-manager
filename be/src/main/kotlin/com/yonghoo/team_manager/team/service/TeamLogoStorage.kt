package com.yonghoo.team_manager.team.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.support.TransactionSynchronization
import org.springframework.transaction.support.TransactionSynchronizationManager
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardOpenOption
import java.util.UUID

@Service
class TeamLogoStorage(
    @Value("\${app.team-logo.storage-path:./uploads/team-logos}") storagePath: String,
    private val imageProcessor: TeamLogoImageProcessor,
) {
    private val root = Path.of(storagePath).toAbsolutePath().normalize()
    private val logger = LoggerFactory.getLogger(javaClass)

    fun save(file: MultipartFile): String {
        val bytes = imageProcessor.normalize(file)
        val name = "${UUID.randomUUID()}.png"
        val path = root.resolve(name)
        var created = false
        try {
            Files.createDirectories(root)
            Files.newOutputStream(path, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE).use { output ->
                created = true
                output.write(bytes)
            }
        } catch (error: Exception) {
            if (created) deleteFailedUpload(path)
            logger.error("Failed to store team logo", error)
            throw ApiException(TeamErrorCode.TEAM_LOGO_STORAGE_FAILED)
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(object : TransactionSynchronization {
                override fun afterCompletion(status: Int) {
                    if (status != TransactionSynchronization.STATUS_COMMITTED) deleteFailedUpload(path)
                }
            })
        }
        return "/teams/logos/$name"
    }

    fun read(name: String): ByteArray {
        if (!FILE_NAME.matches(name)) throw ApiException(TeamErrorCode.TEAM_LOGO_NOT_FOUND)
        val path = root.resolve(name)
        if (!Files.isRegularFile(path)) throw ApiException(TeamErrorCode.TEAM_LOGO_NOT_FOUND)
        return Files.readAllBytes(path)
    }

    private fun deleteFailedUpload(path: Path) {
        try {
            Files.deleteIfExists(path)
        } catch (error: Exception) {
            logger.warn("Failed to clean up uncommitted team logo", error)
        }
    }

    companion object {
        private val FILE_NAME = Regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.png$")
    }
}
