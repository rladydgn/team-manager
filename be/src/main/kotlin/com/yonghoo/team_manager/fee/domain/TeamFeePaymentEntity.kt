package com.yonghoo.team_manager.fee.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class TeamFeePaymentEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<TeamFeePaymentEntity>(TeamFeePaymentsTable)

    var teamId by TeamFeePaymentsTable.teamId
    var teamMemberId by TeamFeePaymentsTable.teamMemberId
    var paymentYear by TeamFeePaymentsTable.paymentYear
    var paymentMonth by TeamFeePaymentsTable.paymentMonth
    var status by TeamFeePaymentsTable.status
    var memo by TeamFeePaymentsTable.memo
    var createdAt by TeamFeePaymentsTable.createdAt
    var updatedAt by TeamFeePaymentsTable.updatedAt
    var deletedAt by TeamFeePaymentsTable.deletedAt
}
