package com.yonghoo.team_manager.inquiry.domain

import java.time.LocalDateTime

data class InquiryRecord(
    val id: Long,
    val userId: Long,
    val category: InquiryCategory,
    val title: String,
    val content: String,
    val status: InquiryStatus,
    val createdAt: LocalDateTime,
) {
    companion object {
        fun from(inquiry: InquiryEntity) = InquiryRecord(
            id = inquiry.id.value,
            userId = inquiry.userId,
            category = inquiry.category,
            title = inquiry.title,
            content = inquiry.content,
            status = inquiry.status,
            createdAt = inquiry.createdAt,
        )
    }
}
