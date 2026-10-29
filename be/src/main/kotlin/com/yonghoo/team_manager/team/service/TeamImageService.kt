package com.yonghoo.team_manager.team.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.dto.TeamImageOrderRequest
import com.yonghoo.team_manager.team.dto.TeamImageResponse
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.TeamImageRepository
import com.yonghoo.team_manager.team.repository.TeamRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile

@Service
@Transactional
class TeamImageService(private val images: TeamImageRepository, private val teams: TeamRepository, private val storage: TeamImageStorage) {
    @Transactional(readOnly = true)
    fun list(teamId: Long): List<TeamImageResponse> {
        requireTeam(teamId)
        return images.list(teamId).map(TeamImageResponse::from)
    }

    @Transactional(readOnly = true)
    fun read(teamId: Long, imageId: Long): ByteArray {
        requireTeam(teamId)
        val image = images.list(teamId).find { it.id == imageId } ?: throw ApiException(TeamErrorCode.TEAM_IMAGE_NOT_FOUND)
        return storage.read(image.imagePath)
    }

    fun upload(teamId: Long, userId: Long, file: MultipartFile): List<TeamImageResponse> {
        requireTeam(teamId)
        requireManager(teamId, userId)
        val validated = storage.validate(file)
        lockAndAuthorize(teamId, userId)
        val existing = images.list(teamId, locking = true)
        if (existing.size >= 3) throw ApiException(TeamErrorCode.TEAM_IMAGE_LIMIT_REACHED)
        val path = storage.save(teamId, validated)
        try {
            images.create(teamId, userId, path, validated.originalFileName, validated.bytes.size,
                (existing.maxOfOrNull { it.sortOrder } ?: -1) + 1)
            return images.list(teamId, locking = true).map(TeamImageResponse::from)
        } catch (error: Exception) {
            storage.cleanup(path)
            throw error
        }
    }

    fun delete(teamId: Long, imageId: Long, userId: Long): List<TeamImageResponse> {
        lockAndAuthorize(teamId, userId)
        if (images.list(teamId, locking = true).none { it.id == imageId }) throw ApiException(TeamErrorCode.TEAM_IMAGE_NOT_FOUND)
        images.delete(teamId, imageId)
        return images.list(teamId, locking = true).map(TeamImageResponse::from)
    }

    fun reorder(teamId: Long, userId: Long, request: TeamImageOrderRequest): List<TeamImageResponse> {
        lockAndAuthorize(teamId, userId)
        val current = images.list(teamId, locking = true).map { it.id }
        if (request.expectedImageIds != current) throw ApiException(TeamErrorCode.TEAM_IMAGES_CHANGED)
        if (request.imageIds.size != current.size || request.imageIds.toSet() != current.toSet()) {
            throw ApiException(TeamErrorCode.INVALID_TEAM_IMAGE_ORDER)
        }
        images.reorder(teamId, request.imageIds)
        return images.list(teamId, locking = true).map(TeamImageResponse::from)
    }

    private fun requireTeam(teamId: Long) {
        if (teams.selectTeamById(teamId) == null) throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
    }

    private fun lockAndAuthorize(teamId: Long, userId: Long) {
        if (!images.lockTeam(teamId)) throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        if (images.managerRole(teamId, userId) !in setOf(TeamMemberRole.OWNER, TeamMemberRole.SUB_MANAGER)) {
            throw ApiException(TeamErrorCode.TEAM_UPDATE_FORBIDDEN)
        }
    }

    private fun requireManager(teamId: Long, userId: Long) {
        if (teams.selectActiveMemberRole(teamId, userId) !in setOf(TeamMemberRole.OWNER, TeamMemberRole.SUB_MANAGER)) {
            throw ApiException(TeamErrorCode.TEAM_UPDATE_FORBIDDEN)
        }
    }
}
