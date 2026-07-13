package com.yonghoo.team_manager.team.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "팀 가입 요청")
data class TeamJoinRequest(
    @field:Schema(description = "가입할 유저 ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    val userId: Long,
)
