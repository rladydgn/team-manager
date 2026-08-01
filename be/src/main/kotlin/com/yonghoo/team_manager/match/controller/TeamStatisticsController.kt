package com.yonghoo.team_manager.match.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.dto.TeamAttendanceStatisticsResponse
import com.yonghoo.team_manager.match.service.MatchService
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.swagger.v3.oas.annotations.Operation
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/teams/{teamId}/statistics")
class TeamStatisticsController(
    private val matchService: MatchService,
) {
    @Operation(summary = "팀원 출석 통계 조회")
    @GetMapping("/attendance")
    fun getAttendanceStatistics(
        @PathVariable teamId: Long,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
    ): ResponseEntity<CommonResponse<TeamAttendanceStatisticsResponse>> {
        return ResponseEntity.ok(
            CommonResponse(
                data = matchService.getAttendanceStatistics(
                    teamId = teamId,
                    userId = requireAuthenticatedUserId(userId),
                    startDate = startDate,
                    endDate = endDate,
                    page = page,
                ),
            ),
        )
    }

    private fun requireAuthenticatedUserId(userId: Long?): Long {
        return userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
    }
}
