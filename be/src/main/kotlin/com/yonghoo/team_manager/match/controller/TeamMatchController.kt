package com.yonghoo.team_manager.match.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.match.dto.MatchResponse
import com.yonghoo.team_manager.match.service.MatchService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/teams/{teamId}/matches")
class TeamMatchController(
    private val matchService: MatchService,
) {
    @Operation(summary = "팀 매치 목록 조회")
    @GetMapping
    fun getMatches(
        @PathVariable teamId: Long,
    ): ResponseEntity<CommonResponse<List<MatchResponse>>> {
        return ResponseEntity.ok(CommonResponse(data = matchService.getMatches(teamId)))
    }
}
