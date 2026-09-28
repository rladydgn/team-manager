package com.yonghoo.team_manager.inquiry.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class InquiryEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<InquiryEntity>(InquiriesTable)

    var userId by InquiriesTable.userId
    var category by InquiriesTable.category
    var title by InquiriesTable.title
    var content by InquiriesTable.content
    var status by InquiriesTable.status
    var createdAt by InquiriesTable.createdAt
    var updatedAt by InquiriesTable.updatedAt
    var deletedAt by InquiriesTable.deletedAt
}
