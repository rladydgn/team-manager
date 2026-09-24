package com.yonghoo.team_manager.inquiry.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.exception.dto.ErrorResponse
import com.yonghoo.team_manager.inquiry.dto.InquiryCreateRequest
import com.yonghoo.team_manager.inquiry.dto.InquiryListResponse
import com.yonghoo.team_manager.inquiry.dto.InquiryResponse
import com.yonghoo.team_manager.inquiry.service.InquiryService
import com.yonghoo.team_manager.inquiry.exception.InquiryErrorCode
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.CacheControl
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException

@RestController
@RequestMapping("/inquiries")
class InquiryController(private val inquiryService: InquiryService) {
    @Operation(summary = "비공개 문의 등록")
    @PostMapping
    fun create(
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: InquiryCreateRequest,
    ): ResponseEntity<CommonResponse<InquiryResponse>> = ResponseEntity.status(HttpStatus.CREATED)
        .cacheControl(CacheControl.noStore())
        .body(CommonResponse(data = inquiryService.create(requireUserId(userId), request)))

    @Operation(summary = "내 문의 목록 조회")
    @GetMapping
    fun listMine(
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestParam(defaultValue = "0") page: Int,
    ): ResponseEntity<CommonResponse<InquiryListResponse>> = ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(CommonResponse(data = inquiryService.listMine(requireUserId(userId), page)))

    @Operation(summary = "내 문의 상세 조회")
    @GetMapping("/{inquiryId}")
    fun getMine(
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @PathVariable inquiryId: Long,
    ): ResponseEntity<CommonResponse<InquiryResponse>> = ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(CommonResponse(data = inquiryService.getMine(requireUserId(userId), inquiryId)))

    @ExceptionHandler(HttpMessageNotReadableException::class, MethodArgumentTypeMismatchException::class)
    fun invalidRequest(): ResponseEntity<ErrorResponse> {
        val error = InquiryErrorCode.INVALID_INQUIRY_REQUEST
        return ResponseEntity.badRequest().cacheControl(CacheControl.noStore())
            .body(ErrorResponse(error.status.value(), error.code, error.message))
    }

    private fun requireUserId(userId: Long?): Long = userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
}
