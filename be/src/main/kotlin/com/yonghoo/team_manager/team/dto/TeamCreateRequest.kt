package com.yonghoo.team_manager.team.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate

@Schema(description = "팀 생성 요청")
data class TeamCreateRequest(
    @field:Schema(description = "팀 이름", example = "서울 FC", requiredMode = Schema.RequiredMode.REQUIRED)
    val name: String,

    @field:Schema(description = "팀 짧은 이름", example = "SFC", nullable = true)
    val shortName: String? = null,

    @field:Schema(description = "팀 로고 URL", example = "https://example.com/logo.png", nullable = true)
    val logoUrl: String? = null,

    @field:Schema(description = "팀 소개", example = "주말마다 풋살을 즐기는 팀입니다.", nullable = true)
    val description: String? = null,

    @field:Schema(description = "활동 지역", example = "서울", nullable = true)
    val region: String? = null,

    @field:Schema(description = "홈 구장", example = "잠실 풋살장", nullable = true)
    val homeStadium: String? = null,

    @field:Schema(description = "창단일", example = "2026-07-13", nullable = true)
    val foundedAt: LocalDate? = null,

    @field:Schema(description = "팀 색상", example = "#0F766E", nullable = true)
    val teamColor: String? = null,
)
