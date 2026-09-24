package com.yonghoo.team_manager.inquiry.repository

import com.yonghoo.team_manager.inquiry.domain.InquiriesTable
import com.yonghoo.team_manager.inquiry.domain.InquiryCategory
import com.yonghoo.team_manager.inquiry.domain.InquiryEntity
import com.yonghoo.team_manager.inquiry.domain.InquiryRecord
import com.yonghoo.team_manager.inquiry.domain.InquiryStatus
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository

@Repository
class InquiryRepository {
    fun create(userId: Long, category: InquiryCategory, title: String, content: String): InquiryRecord =
        InquiryEntity.new {
            this.userId = userId
            this.category = category
            this.title = title
            this.content = content
            status = InquiryStatus.WAITING
        }.let(InquiryRecord::from)

    // Ownership is part of the query, including for callers who manage a team.
    fun selectByIdAndUserId(inquiryId: Long, userId: Long): InquiryRecord? = InquiryEntity.find {
        (InquiriesTable.id eq inquiryId) and (InquiriesTable.userId eq userId) and InquiriesTable.deletedAt.isNull()
    }.firstOrNull()?.let(InquiryRecord::from)

    fun selectByUserId(userId: Long, offset: Long, limit: Int): List<InquiryRecord> = InquiryEntity.find {
        (InquiriesTable.userId eq userId) and InquiriesTable.deletedAt.isNull()
    }.orderBy(InquiriesTable.createdAt to SortOrder.DESC, InquiriesTable.id to SortOrder.DESC)
        .limit(limit).offset(offset).map(InquiryRecord::from)
}
