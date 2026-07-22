package com.yonghoo.team_manager.fee.domain

import java.time.LocalDateTime

data class TeamFeePaymentRecord(
    val id: Long,
    val teamId: Long,
    val teamMemberId: Long,
    val paymentYear: Int,
    val paymentMonth: Int,
    val status: FeePaymentStatus,
    val memo: String?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val deletedAt: LocalDateTime?,
) {
    companion object {
        fun from(payment: TeamFeePaymentEntity): TeamFeePaymentRecord {
            return TeamFeePaymentRecord(
                id = payment.id.value,
                teamId = payment.teamId,
                teamMemberId = payment.teamMemberId,
                paymentYear = payment.paymentYear,
                paymentMonth = payment.paymentMonth,
                status = payment.status,
                memo = payment.memo,
                createdAt = payment.createdAt,
                updatedAt = payment.updatedAt,
                deletedAt = payment.deletedAt,
            )
        }
    }
}
