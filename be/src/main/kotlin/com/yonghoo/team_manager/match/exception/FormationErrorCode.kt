package com.yonghoo.team_manager.match.exception

import com.yonghoo.team_manager.exception.dto.ErrorCode
import org.springframework.http.HttpStatus

enum class FormationErrorCode(override val status: HttpStatus, override val message: String) : ErrorCode {
    INVALID_MATCH_FORMATION_REQUEST(HttpStatus.BAD_REQUEST, "포메이션 입력을 확인해 주세요."),
    MATCH_FORMATION_PLAYER_INELIGIBLE(HttpStatus.BAD_REQUEST, "참석 명단 또는 편 배정이 바뀌었어요. 배치를 확인해 주세요."),
    INVALID_MATCH_SIDE_ASSIGNMENT_REQUEST(HttpStatus.BAD_REQUEST, "편 배정 입력과 최신 참석 명단을 확인해 주세요."),
    MATCH_FORMATION_LIMIT_REACHED(HttpStatus.CONFLICT, "포메이션은 경기당 최대 10개까지 만들 수 있어요."),
    MATCH_FORMATION_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 운영진이 수정했어요. 최신 내용을 확인해 주세요."),
    MATCH_FORMATION_MATCH_CANCELED(HttpStatus.CONFLICT, "취소된 경기에서는 포메이션을 저장할 수 없어요."),
    MATCH_SIDE_ASSIGNMENT_VERSION_CONFLICT(HttpStatus.CONFLICT, "다른 운영진이 편 배정을 수정했어요. 최신 내용을 확인해 주세요."),
    MATCH_SIDE_ASSIGNMENT_RECORD_EDIT_REQUIRED(HttpStatus.CONFLICT, "기록이 있는 경기의 편 변경은 경기 기록 화면에서 점수와 함께 정정해 주세요."),
    MATCH_SIDE_ASSIGNMENT_MATCH_CANCELED(HttpStatus.CONFLICT, "취소된 경기에서는 편 배정을 저장할 수 없어요.");
    override val code: String get() = name
}
