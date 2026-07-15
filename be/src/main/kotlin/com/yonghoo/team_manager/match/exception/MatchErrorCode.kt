package com.yonghoo.team_manager.match.exception

import com.yonghoo.team_manager.exception.dto.ErrorCode
import org.springframework.http.HttpStatus

enum class MatchErrorCode(
    override val status: HttpStatus,
    override val message: String,
) : ErrorCode {
    INVALID_MATCH_REQUEST(
        status = HttpStatus.BAD_REQUEST,
        message = "매치 요청 값이 올바르지 않습니다.",
    ),
    MATCH_NOT_FOUND(
        status = HttpStatus.NOT_FOUND,
        message = "매치를 찾을 수 없습니다.",
    ),
    MATCH_CREATION_FORBIDDEN(
        status = HttpStatus.FORBIDDEN,
        message = "팀장 또는 부관리자만 매치를 생성할 수 있습니다.",
    );

    override val code: String
        get() = name
}
