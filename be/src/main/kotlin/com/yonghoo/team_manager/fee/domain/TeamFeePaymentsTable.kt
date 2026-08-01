package com.yonghoo.team_manager.fee.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object TeamFeePaymentsTable : LongIdTable("team_fee_payments") {
    val teamId = long("team_id")
    val teamMemberId = long("team_member_id")
    val paymentYear = integer("payment_year")
    val paymentMonth = integer("payment_month")
    val status = enumerationByName("status", 20, FeePaymentStatus::class).clientDefault { FeePaymentStatus.UNPAID }
    val memo = varchar("memo", 500).nullable()
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt = datetime("updated_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
