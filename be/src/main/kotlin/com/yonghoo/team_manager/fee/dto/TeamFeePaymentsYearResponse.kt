package com.yonghoo.team_manager.fee.dto

import com.yonghoo.team_manager.fee.domain.FeePaymentStatus
import com.yonghoo.team_manager.team.domain.TeamMemberRole

data class TeamFeePaymentsYearResponse(
    val paymentYear: Int,
    val members: List<TeamFeePaymentMemberResponse>,
)

data class TeamFeePaymentMemberResponse(
    val teamMemberId: Long,
    val name: String,
    val role: TeamMemberRole,
    val payments: List<TeamFeePaymentMonthResponse>,
)

data class TeamFeePaymentMonthResponse(
    val paymentMonth: Int,
    val status: FeePaymentStatus,
    val memo: String?,
)
