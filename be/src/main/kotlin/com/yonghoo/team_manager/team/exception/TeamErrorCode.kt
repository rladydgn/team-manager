package com.yonghoo.team_manager.team.exception

import com.yonghoo.team_manager.exception.dto.ErrorCode
import org.springframework.http.HttpStatus

enum class TeamErrorCode(
    override val status: HttpStatus,
    override val message: String,
) : ErrorCode {
    INVALID_TEAM_REQUEST(
        status = HttpStatus.BAD_REQUEST,
        message = "팀 요청 값이 올바르지 않습니다.",
    ),
    TEAM_NOT_FOUND(
        status = HttpStatus.NOT_FOUND,
        message = "팀을 찾을 수 없습니다.",
    ),
    TEAM_UPDATE_FORBIDDEN(
        status = HttpStatus.FORBIDDEN,
        message = "팀 수정 권한이 없습니다.",
    ),
    TEAM_DELETE_FORBIDDEN(
        status = HttpStatus.FORBIDDEN,
        message = "팀 삭제는 OWNER만 할 수 있습니다.",
    ),
    TEAM_DELETE_REQUIRES_SOLE_MEMBER(
        status = HttpStatus.CONFLICT,
        message = "팀에 본인만 남아 있을 때 삭제할 수 있습니다.",
    ),
    USER_NOT_FOUND(
        status = HttpStatus.NOT_FOUND,
        message = "사용자를 찾을 수 없습니다.",
    ),
    ALREADY_JOINED_TEAM(
        status = HttpStatus.CONFLICT,
        message = "이미 가입된 팀입니다.",
    ),
    TEAM_JOIN_REQUEST_PENDING(
        status = HttpStatus.CONFLICT,
        message = "이미 가입 신청이 대기 중입니다.",
    ),
    TEAM_JOIN_REQUEST_FORBIDDEN(
        status = HttpStatus.FORBIDDEN,
        message = "이 팀에 가입 신청할 수 없습니다.",
    ),
    TEAM_JOIN_REQUEST_MANAGEMENT_FORBIDDEN(
        status = HttpStatus.FORBIDDEN,
        message = "가입 신청을 관리할 권한이 없습니다.",
    ),
    TEAM_JOIN_REQUEST_NOT_FOUND(
        status = HttpStatus.NOT_FOUND,
        message = "대기 중인 가입 신청을 찾을 수 없습니다.",
    );

    override val code: String
        get() = name
}
