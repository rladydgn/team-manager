package com.yonghoo.team_manager.inquiry.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object InquiriesTable : LongIdTable("inquiries") {
    val userId = long("user_id")
    val category = enumerationByName("category", 20, InquiryCategory::class)
    val title = varchar("title", 100)
    val content = text("content")
    val status = enumerationByName("status", 20, InquiryStatus::class).default(InquiryStatus.WAITING)
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt = datetime("updated_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
