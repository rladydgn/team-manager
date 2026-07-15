package com.yonghoo.team_manager.team.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.dto.TeamCreateRequest
import com.yonghoo.team_manager.team.dto.TeamDetailResponse
import com.yonghoo.team_manager.team.dto.TeamMemberResponse
import com.yonghoo.team_manager.team.dto.TeamResponse
import com.yonghoo.team_manager.team.service.TeamService
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/teams")
class TeamController(
    private val teamService: TeamService,
) {
    @Operation(
        summary = "팀 생성",
        description = "축구 팀을 생성하고 생성자를 팀 OWNER로 등록합니다.",
    )
    @PostMapping
    fun createTeam(
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: TeamCreateRequest,
    ): ResponseEntity<CommonResponse<TeamResponse>> {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(CommonResponse(data = teamService.createTeam(requireAuthenticatedUserId(userId), request)))
    }

    @Operation(
        summary = "팀 가입",
        description = "유저를 팀 MEMBER로 가입시킵니다.",
    )
    @PostMapping("/{teamId}/members")
    fun joinTeam(
        @PathVariable teamId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
    ): ResponseEntity<CommonResponse<TeamMemberResponse>> {
        return ResponseEntity.ok(CommonResponse(data = teamService.joinTeam(teamId, requireAuthenticatedUserId(userId))))
    }

    @Operation(
        summary = "팀 목록 조회",
        description = "활성 상태의 팀 목록을 조회합니다.",
    )
    @GetMapping
    fun getTeams(): ResponseEntity<CommonResponse<List<TeamResponse>>> {
        return ResponseEntity.ok(CommonResponse(data = teamService.getTeams()))
    }

    @Operation(
        summary = "팀 단건 조회",
        description = "팀 정보와 활성 멤버 목록을 조회합니다.",
    )
    @GetMapping("/{teamId}")
    fun getTeam(
        @PathVariable teamId: Long,
    ): ResponseEntity<CommonResponse<TeamDetailResponse>> {
        return ResponseEntity.ok(CommonResponse(data = teamService.getTeam(teamId)))
    }

    private fun requireAuthenticatedUserId(userId: Long?): Long {
        return userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
    }
}
