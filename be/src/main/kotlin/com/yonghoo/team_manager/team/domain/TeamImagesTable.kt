package com.yonghoo.team_manager.team.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object TeamImagesTable : LongIdTable("team_images") {
    val teamId = long("team_id")
    val imagePath = varchar("image_path", 500)
    val originalFileName = varchar("original_file_name", 255)
    val fileSizeBytes = integer("file_size_bytes")
    val sortOrder = integer("sort_order").default(0)
    val createdByUserId = long("created_by_user_id")
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
