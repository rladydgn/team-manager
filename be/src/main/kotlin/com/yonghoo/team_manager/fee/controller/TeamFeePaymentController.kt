package com.yonghoo.team_manager.fee.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentResponse
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentUpdateRequest
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentsYearResponse
import com.yonghoo.team_manager.fee.service.FeePaymentService
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/teams/{teamId}/fee-payments")
class TeamFeePaymentController(
    private val feePaymentService: FeePaymentService,
) {
    @Operation(summary = "팀 회비 납부 현황 조회")
    @GetMapping
    fun getTeamFeePayments(
        @PathVariable teamId: Long,
        @RequestParam paymentYear: Int,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
    ): ResponseEntity<CommonResponse<TeamFeePaymentsYearResponse>> {
        return ResponseEntity.ok(
            CommonResponse(
                data = feePaymentService.getTeamFeePayments(
                    teamId = teamId,
                    userId = requireAuthenticatedUserId(userId),
                    paymentYear = paymentYear,
                ),
            ),
        )
    }

    @Operation(summary = "팀원 월별 회비 납부 상태 수정")
    @PutMapping
    fun updateTeamFeePayment(
        @PathVariable teamId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: TeamFeePaymentUpdateRequest,
    ): ResponseEntity<CommonResponse<TeamFeePaymentResponse>> {
        return ResponseEntity.ok(
            CommonResponse(
                data = feePaymentService.updateTeamFeePayment(
                    teamId = teamId,
                    userId = requireAuthenticatedUserId(userId),
                    request = request,
                ),
            ),
        )
    }

    private fun requireAuthenticatedUserId(userId: Long?): Long {
        return userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
    }
}
