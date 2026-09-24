package com.yonghoo.team_manager.inquiry.dto

import com.yonghoo.team_manager.inquiry.domain.InquiryCategory
import com.yonghoo.team_manager.inquiry.domain.InquiryRecord
import com.yonghoo.team_manager.inquiry.domain.InquiryStatus
import java.time.LocalDateTime

data class InquiryResponse(
    val id: Long,
    val category: InquiryCategory,
    val title: String,
    val content: String,
    val status: InquiryStatus,
    val createdAt: LocalDateTime,
) {
    companion object {
        fun from(inquiry: InquiryRecord) = InquiryResponse(
            inquiry.id, inquiry.category, inquiry.title, inquiry.content, inquiry.status, inquiry.createdAt,
        )
    }
}

data class InquirySummaryResponse(
    val id: Long,
    val category: InquiryCategory,
    val title: String,
    val status: InquiryStatus,
    val createdAt: LocalDateTime,
) {
    companion object {
        fun from(inquiry: InquiryRecord) = InquirySummaryResponse(
            inquiry.id, inquiry.category, inquiry.title, inquiry.status, inquiry.createdAt,
        )
    }
}

data class InquiryListResponse(
    val inquiries: List<InquirySummaryResponse>,
    val page: Int,
    val pageSize: Int,
    val hasNext: Boolean,
)
