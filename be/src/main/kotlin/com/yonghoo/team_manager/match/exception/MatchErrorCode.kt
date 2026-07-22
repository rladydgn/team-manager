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
    ),
    MATCH_VIEW_FORBIDDEN(
        status = HttpStatus.FORBIDDEN,
        message = "팀에 가입한 회원만 경기 일정을 조회할 수 있습니다.",
    ),
    INVALID_MATCH_PARTICIPATION_REQUEST(
        status = HttpStatus.BAD_REQUEST,
        message = "매치 참여 상태 값이 올바르지 않습니다.",
    ),
    MATCH_PARTICIPATION_MEMO_TOO_LONG(
        status = HttpStatus.BAD_REQUEST,
        message = "매치 참여 메모는 500자 이내로 입력해 주세요.",
    ),
    INVALID_MATCH_STATISTICS_REQUEST(
        status = HttpStatus.BAD_REQUEST,
        message = "통계 조회 기간 또는 페이지 값이 올바르지 않습니다.",
    ),
    MATCH_PARTICIPATION_CLOSED(
        status = HttpStatus.CONFLICT,
        message = "매치 시작 24시간 전까지만 참여 여부를 변경할 수 있습니다.",
    );

    override val code: String
        get() = name
}
