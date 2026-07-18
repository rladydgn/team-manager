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
    DUPLICATED_EMAIL(
        status = HttpStatus.CONFLICT,
        message = "이미 사용 중인 이메일입니다.",
    ),
    LOGIN_FAILED(
        status = HttpStatus.UNAUTHORIZED,
        message = "아이디 또는 비밀번호가 올바르지 않습니다.",
    ),
    UNAUTHORIZED_ACCESS(
        status = HttpStatus.UNAUTHORIZED,
        message = "로그인이 필요하거나 인증 정보가 유효하지 않습니다.",
    ),
    INVALID_REFRESH_TOKEN(
        status = HttpStatus.UNAUTHORIZED,
        message = "리프레시 토큰이 유효하지 않습니다.",
    );

    override val code: String
        get() = name
}
