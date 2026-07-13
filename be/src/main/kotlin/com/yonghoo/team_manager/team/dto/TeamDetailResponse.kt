package com.yonghoo.team_manager.team.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "팀 상세 응답")
data class TeamDetailResponse(
    @field:Schema(description = "팀 정보")
    val team: TeamResponse,

    @field:Schema(description = "팀 멤버 목록")
    val members: List<TeamMemberResponse>,
)
