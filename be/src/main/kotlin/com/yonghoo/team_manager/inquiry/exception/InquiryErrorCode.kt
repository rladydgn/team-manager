package com.yonghoo.team_manager.inquiry.exception

import com.yonghoo.team_manager.exception.dto.ErrorCode
import org.springframework.http.HttpStatus

enum class InquiryErrorCode(
    override val status: HttpStatus,
    override val message: String,
) : ErrorCode {
    INVALID_INQUIRY_REQUEST(HttpStatus.BAD_REQUEST, "카테고리와 제목(1~100자), 내용(1~10,000자)을 확인해 주세요."),
    INVALID_INQUIRY_PAGE(HttpStatus.BAD_REQUEST, "문의 목록 페이지가 올바르지 않습니다."),
    INQUIRY_NOT_FOUND(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다."),
    ;

    override val code: String get() = name
}
