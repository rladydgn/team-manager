package com.yonghoo.team_manager.user.exception

import com.yonghoo.team_manager.exception.dto.ErrorCode
import org.springframework.http.HttpStatus

enum class UserErrorCode(
    override val status: HttpStatus,
    override val message: String,
) : ErrorCode {
    INVALID_REGISTER_REQUEST(
        status = HttpStatus.BAD_REQUEST,
        message = "회원가입 요청 값이 올바르지 않습니다.",
    ),
    DUPLICATED_USERNAME(
        status = HttpStatus.CONFLICT,
        message = "이미 사용 중인 아이디입니다.",
    ),
    LOGIN_FAILED(
        status = HttpStatus.UNAUTHORIZED,
        message = "아이디 또는 비밀번호가 올바르지 않습니다.",
    );

    override val code: String
        get() = name
}
