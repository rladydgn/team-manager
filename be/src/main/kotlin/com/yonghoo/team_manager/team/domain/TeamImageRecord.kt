package com.yonghoo.team_manager.team.domain

import java.time.LocalDateTime

data class TeamImageRecord(
    val id: Long,
    val teamId: Long,
    val imagePath: String,
    val originalFileName: String,
    val fileSizeBytes: Int,
    val sortOrder: Int,
    val createdByUserId: Long,
    val createdAt: LocalDateTime,
)
