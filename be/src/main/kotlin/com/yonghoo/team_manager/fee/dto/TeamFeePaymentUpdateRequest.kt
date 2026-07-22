package com.yonghoo.team_manager.fee.dto

import com.yonghoo.team_manager.fee.domain.FeePaymentStatus

data class TeamFeePaymentUpdateRequest(
    val teamMemberId: Long,
    val paymentYear: Int,
    val paymentMonth: Int,
    val status: FeePaymentStatus,
    val memo: String? = null,
)
