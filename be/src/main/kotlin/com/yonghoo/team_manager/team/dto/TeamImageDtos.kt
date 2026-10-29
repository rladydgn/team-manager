package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamImageRecord
import java.time.LocalDateTime

data class TeamImageResponse(
    val id: Long,
    val url: String,
    val originalFileName: String,
    val fileSizeBytes: Int,
    val createdAt: LocalDateTime,
) {
    companion object {
        fun from(image: TeamImageRecord) = TeamImageResponse(image.id,
            "/teams/${image.teamId}/images/${image.id}/file", image.originalFileName, image.fileSizeBytes, image.createdAt)
    }
}

data class TeamImageOrderRequest(val imageIds: List<Long>, val expectedImageIds: List<Long>)
