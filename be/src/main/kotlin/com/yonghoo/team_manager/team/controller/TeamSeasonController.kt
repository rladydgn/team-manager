package com.yonghoo.team_manager.team.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.dto.TeamSeasonCreateRequest
import com.yonghoo.team_manager.team.dto.TeamSeasonOrderUpdateRequest
import com.yonghoo.team_manager.team.dto.TeamSeasonResponse
import com.yonghoo.team_manager.team.service.TeamSeasonService
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/teams/{teamId}/seasons")
class TeamSeasonController(private val teamSeasonService: TeamSeasonService) {
    @Operation(summary = "팀 시즌 목록 조회")
    @GetMapping
    fun getSeasons(
        @PathVariable teamId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
    ) = ResponseEntity.ok(CommonResponse(data = teamSeasonService.getSeasons(teamId, authenticated(userId))))

    @Operation(summary = "팀 시즌 생성")
    @PostMapping
    fun createSeason(
        @PathVariable teamId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: TeamSeasonCreateRequest,
    ): ResponseEntity<CommonResponse<List<TeamSeasonResponse>>> = ResponseEntity.status(HttpStatus.CREATED).body(
        CommonResponse(data = teamSeasonService.createSeason(teamId, authenticated(userId), request)),
    )

    @Operation(summary = "기본 시즌 설정")
    @PutMapping("/{seasonId}/default")
    fun setDefault(
        @PathVariable teamId: Long,
        @PathVariable seasonId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
    ) = ResponseEntity.ok(CommonResponse(data = teamSeasonService.setDefault(teamId, seasonId, authenticated(userId))))

    @Operation(summary = "시즌 노출 순서 변경")
    @PutMapping("/order")
    fun updateOrder(
        @PathVariable teamId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: TeamSeasonOrderUpdateRequest,
    ) = ResponseEntity.ok(CommonResponse(data = teamSeasonService.updateOrder(teamId, authenticated(userId), request)))

    private fun authenticated(userId: Long?) = userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
}
