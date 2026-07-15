package com.yonghoo.team_manager.match.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.dto.MatchCreateRequest
import com.yonghoo.team_manager.match.dto.MatchResponse
import com.yonghoo.team_manager.match.service.MatchService
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/matches")
class MatchController(
    private val matchService: MatchService,
) {
    @Operation(summary = "매치 생성")
    @PostMapping
    fun createMatch(
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: MatchCreateRequest,
    ): ResponseEntity<CommonResponse<MatchResponse>> {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(CommonResponse(data = matchService.createMatch(requireAuthenticatedUserId(userId), request)))
    }

    @Operation(summary = "매치 단건 조회")
    @GetMapping("/{matchId}")
    fun getMatch(
        @PathVariable matchId: Long,
    ): ResponseEntity<CommonResponse<MatchResponse>> {
        return ResponseEntity.ok(CommonResponse(data = matchService.getMatch(matchId)))
    }

    private fun requireAuthenticatedUserId(userId: Long?): Long {
        return userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
    }
}
