package com.yonghoo.team_manager.fee.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.fee.domain.FeePaymentStatus
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentMemberResponse
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentMonthResponse
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentResponse
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentUpdateRequest
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentsYearResponse
import com.yonghoo.team_manager.fee.exception.FeePaymentErrorCode
import com.yonghoo.team_manager.fee.repository.TeamFeePaymentRepository
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamMemberStatus
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Transactional
@Service
class FeePaymentService(
    private val teamFeePaymentRepository: TeamFeePaymentRepository,
    private val teamRepository: TeamRepository,
    private val userRepository: UserRepository,
) {
    @Transactional(readOnly = true)
    fun getTeamFeePayments(
        teamId: Long,
        userId: Long,
        paymentYear: Int,
    ): TeamFeePaymentsYearResponse {
        validatePaymentYear(paymentYear)
        validateTeamExists(teamId)
        validateFeeManagementPermission(teamId, userId)

        val members = teamRepository.selectMembersByTeamId(teamId)
        val namesByUserId = userRepository
            .selectUsersByIds(members.mapNotNull { it.userId })
            .associateBy({ it.id }, { it.name })
        val paymentsByMemberAndMonth = teamFeePaymentRepository
            .selectPaymentsByTeamAndYear(teamId, paymentYear)
            .associateBy { it.teamMemberId to it.paymentMonth }

        return TeamFeePaymentsYearResponse(
            paymentYear = paymentYear,
            members = members.map { member ->
                TeamFeePaymentMemberResponse(
                    teamMemberId = member.id,
                    name = member.userId?.let(namesByUserId::get) ?: "미가입 팀원",
                    role = member.role,
                    payments = (1..MONTHS_IN_YEAR).map { paymentMonth ->
                        val payment = paymentsByMemberAndMonth[member.id to paymentMonth]

                        TeamFeePaymentMonthResponse(
                            paymentMonth = paymentMonth,
                            status = payment?.status ?: FeePaymentStatus.UNPAID,
                            memo = payment?.memo,
                        )
                    },
                )
            },
        )
    }

    fun updateTeamFeePayment(
        teamId: Long,
        userId: Long,
        request: TeamFeePaymentUpdateRequest,
    ): TeamFeePaymentResponse {
        validatePaymentRequest(request)
        validateTeamExists(teamId)
        validateFeeManagementPermission(teamId, userId)

        val member = teamRepository.selectTeamMemberById(teamId, request.teamMemberId)
            ?.takeIf { it.status == TeamMemberStatus.ACTIVE }
            ?: throw ApiException(FeePaymentErrorCode.TEAM_MEMBER_NOT_FOUND)
        val payment = teamFeePaymentRepository.upsertPayment(
            teamId = teamId,
            teamMemberId = member.id,
            paymentYear = request.paymentYear,
            paymentMonth = request.paymentMonth,
            status = request.status,
            memo = request.memo.cleanOptional(),
        )

        return TeamFeePaymentResponse.from(payment)
    }

    private fun validatePaymentRequest(request: TeamFeePaymentUpdateRequest) {
        validatePaymentYear(request.paymentYear)

        if (request.paymentMonth !in 1..MONTHS_IN_YEAR ||
            request.memo?.trim()?.length?.let { it > MEMO_MAX_LENGTH } == true
        ) {
            throw ApiException(FeePaymentErrorCode.INVALID_FEE_PAYMENT_REQUEST)
        }
    }

    private fun validatePaymentYear(paymentYear: Int) {
        if (paymentYear !in MIN_PAYMENT_YEAR..MAX_PAYMENT_YEAR) {
            throw ApiException(FeePaymentErrorCode.INVALID_FEE_PAYMENT_REQUEST)
        }
    }

    private fun validateTeamExists(teamId: Long) {
        if (teamRepository.selectTeamById(teamId) == null) {
            throw ApiException(TeamErrorCode.TEAM_NOT_FOUND)
        }
    }

    private fun validateFeeManagementPermission(teamId: Long, userId: Long) {
        val role = teamRepository.selectActiveMemberRole(teamId, userId)

        if (role != TeamMemberRole.OWNER && role != TeamMemberRole.SUB_MANAGER) {
            throw ApiException(FeePaymentErrorCode.FEE_PAYMENT_MANAGEMENT_FORBIDDEN)
        }
    }

    private fun String?.cleanOptional(): String? {
        return this?.trim()?.takeIf(String::isNotBlank)
    }

    companion object {
        private const val MIN_PAYMENT_YEAR = 2000
        private const val MAX_PAYMENT_YEAR = 2100
        private const val MONTHS_IN_YEAR = 12
        private const val MEMO_MAX_LENGTH = 500
    }
}
