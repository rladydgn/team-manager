package com.yonghoo.team_manager.fee.dto

import com.yonghoo.team_manager.fee.domain.FeePaymentStatus
import com.yonghoo.team_manager.fee.domain.TeamFeePaymentRecord

data class TeamFeePaymentResponse(
    val teamMemberId: Long,
    val paymentYear: Int,
    val paymentMonth: Int,
    val status: FeePaymentStatus,
    val memo: String?,
) {
    companion object {
        fun from(payment: TeamFeePaymentRecord): TeamFeePaymentResponse {
            return TeamFeePaymentResponse(
                teamMemberId = payment.teamMemberId,
                paymentYear = payment.paymentYear,
                paymentMonth = payment.paymentMonth,
                status = payment.status,
                memo = payment.memo,
            )
        }
    }
}
