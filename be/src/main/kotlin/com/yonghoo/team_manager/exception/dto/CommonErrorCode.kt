package com.yonghoo.team_manager.exception.dto

import org.springframework.http.HttpStatus

enum class CommonErrorCode(
    override val status: HttpStatus,
    override val message: String,
) : ErrorCode {

    INVALID_REQUEST(
        status = HttpStatus.BAD_REQUEST,
        message = "요청 값이 올바르지 않습니다.",
    ),

    MESSAGE_NOT_READABLE(
        status = HttpStatus.BAD_REQUEST,
        message = "요청 본문을 읽을 수 없습니다.",
    ),

    UNAUTHORIZED(
        status = HttpStatus.UNAUTHORIZED,
        message = "인증이 필요합니다.",
    ),

    ACCESS_DENIED(
        status = HttpStatus.FORBIDDEN,
        message = "접근 권한이 없습니다.",
    ),

    RESOURCE_NOT_FOUND(
        status = HttpStatus.NOT_FOUND,
        message = "요청한 리소스를 찾을 수 없습니다.",
    ),

    METHOD_NOT_ALLOWED(
        status = HttpStatus.METHOD_NOT_ALLOWED,
        message = "지원하지 않는 요청 방식입니다.",
    ),

    MEDIA_TYPE_NOT_SUPPORTED(
        status = HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        message = "지원하지 않는 요청 형식입니다.",
    ),

    COMMON_ERROR(
        status = HttpStatus.NOT_FOUND,
        message = "오류가 발상했습니다. 잠시후 다시 시도해주세요.",
    ),

    INTERNAL_SERVER_ERROR(
        status = HttpStatus.INTERNAL_SERVER_ERROR,
        message = "서버 내부 오류가 발생했습니다.",
    );

    override val code: String
        get() = name
}
