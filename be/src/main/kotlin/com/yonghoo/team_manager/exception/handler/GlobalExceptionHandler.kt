package com.yonghoo.team_manager.exception.handler

import com.yonghoo.team_manager.exception.dto.CommonErrorCode
import com.yonghoo.team_manager.exception.dto.ErrorCode
import com.yonghoo.team_manager.exception.dto.ErrorResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.multipart.MaxUploadSizeExceededException

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(MaxUploadSizeExceededException::class)
    fun handleUploadTooLarge(): ResponseEntity<ErrorResponse> = ResponseEntity
        .status(HttpStatus.PAYLOAD_TOO_LARGE)
        .body(ErrorResponse(413, "UPLOAD_TOO_LARGE", "로고는 1MB 이하의 파일로 올려 주세요."))

    @ExceptionHandler(ApiException::class)
    fun handleApiException(
        exception: ApiException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logException(exception, exception.errorCode, request)
        // Keep authentication's 401 for cookie refresh; conceal inaccessible resources.
        if (exception.errorCode.status == HttpStatus.FORBIDDEN || exception.errorCode.status == HttpStatus.NOT_FOUND) {
            return createResponse(CommonErrorCode.RESOURCE_NOT_FOUND)
        }
        return createResponse(exception.errorCode, exception.message)
    }

    @ExceptionHandler(Exception::class)
    fun handleUnexpectedException(
        exception: Exception,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logException(exception, CommonErrorCode.INTERNAL_SERVER_ERROR, request)
        return createResponse(CommonErrorCode.INTERNAL_SERVER_ERROR)
    }

    private fun createResponse(
        errorCode: ErrorCode,
        message: String = errorCode.message,
    ): ResponseEntity<ErrorResponse> {
        val response = ErrorResponse(errorCode.status.value(), errorCode.code, message)
        return ResponseEntity.status(errorCode.status).body(response)
    }

    private fun logException(
        exception: Exception,
        errorCode: ErrorCode,
        request: HttpServletRequest,
    ) {
        val logMessage = "API exception: code={}, status={}, method={}, uri={}".trimIndent()

        log.warn(logMessage, errorCode.code, errorCode.status.value(), request.method, request.requestURI, exception)
    }
}
