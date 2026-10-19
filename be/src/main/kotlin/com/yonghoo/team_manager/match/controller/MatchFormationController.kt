package com.yonghoo.team_manager.match.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.dto.ErrorResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.match.exception.FormationErrorCode
import com.yonghoo.team_manager.match.service.MatchFormationService
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.swagger.v3.oas.annotations.Operation
import jakarta.servlet.http.HttpServletRequest
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.*
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException

@RestController
@RequestMapping("/matches/{matchId}")
class MatchFormationController(private val service: MatchFormationService) {
    @Operation(summary = "경기 포메이션 조회")
    @GetMapping("/formations")
    fun list(@PathVariable matchId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?) =
        ok(service.list(matchId, authenticated(userId)))

    @Operation(summary = "경기 포메이션 생성")
    @PostMapping("/formations")
    fun create(@PathVariable matchId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: MatchFormationRequest) =
        ResponseEntity.status(201).cacheControl(CacheControl.noStore())
            .body(CommonResponse(data = service.save(matchId, authenticated(userId), request)))

    @Operation(summary = "경기 포메이션 수정")
    @PutMapping("/formations/{formationId}")
    fun update(@PathVariable matchId: Long, @PathVariable formationId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: MatchFormationRequest) = ok(service.save(matchId, authenticated(userId), request, formationId))

    @Operation(summary = "경기 포메이션 삭제")
    @DeleteMapping("/formations/{formationId}")
    fun delete(@PathVariable matchId: Long, @PathVariable formationId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestParam version: Long) = ok(service.delete(matchId, formationId, authenticated(userId), version))

    @Operation(summary = "자체 경기 참가자 편 배정 조회")
    @GetMapping("/participant-sides")
    fun sides(@PathVariable matchId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?) =
        ok(service.sides(matchId, authenticated(userId)))

    @Operation(summary = "자체 경기 참가자 편 배정 저장")
    @PatchMapping("/participant-sides")
    fun assignSides(@PathVariable matchId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: ParticipantSidesRequest) = ok(service.assignSides(matchId, authenticated(userId), request))

    private fun authenticated(userId: Long?) = userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
    private fun <T> ok(data: T) = ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(CommonResponse(data = data))
}

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = [MatchFormationController::class])
class FormationRequestExceptionHandler {
    @ExceptionHandler(HttpMessageNotReadableException::class, MethodArgumentTypeMismatchException::class,
        MissingServletRequestParameterException::class)
    fun invalid(request: HttpServletRequest): ResponseEntity<ErrorResponse> {
        val code = if (request.requestURI.endsWith("/participant-sides")) FormationErrorCode.INVALID_MATCH_SIDE_ASSIGNMENT_REQUEST
            else FormationErrorCode.INVALID_MATCH_FORMATION_REQUEST
        return ResponseEntity.badRequest().cacheControl(CacheControl.noStore()).body(ErrorResponse(400, code.code, code.message))
    }
}
