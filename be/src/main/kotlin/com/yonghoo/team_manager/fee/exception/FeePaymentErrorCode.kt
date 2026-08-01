package com.yonghoo.team_manager.fee.exception

import com.yonghoo.team_manager.exception.dto.ErrorCode
import org.springframework.http.HttpStatus

enum class FeePaymentErrorCode(
    override val status: HttpStatus,
    override val message: String,
) : ErrorCode {
    FEE_PAYMENT_MANAGEMENT_FORBIDDEN(
        status = HttpStatus.FORBIDDEN,
        message = "회비 납부 현황은 팀장 또는 부관리자만 관리할 수 있습니다.",
    ),
    TEAM_MEMBER_NOT_FOUND(
        status = HttpStatus.NOT_FOUND,
        message = "팀원을 찾을 수 없습니다.",
    ),
    INVALID_FEE_PAYMENT_REQUEST(
        status = HttpStatus.BAD_REQUEST,
        message = "회비 납부 요청 값이 올바르지 않습니다.",
    );

    override val code: String
        get() = name
}
