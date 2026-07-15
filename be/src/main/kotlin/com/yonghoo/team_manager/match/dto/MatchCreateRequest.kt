package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchType
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDateTime

@Schema(description = "매치 생성 요청")
data class MatchCreateRequest(
    @field:Schema(description = "우리 팀 ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    val teamId: Long,

    @field:Schema(description = "매치 유형", example = "EXTERNAL", requiredMode = Schema.RequiredMode.REQUIRED)
    val matchType: MatchType,

    @field:Schema(description = "서비스에 등록된 상대 팀 ID", example = "2", nullable = true)
    val opponentTeamId: Long? = null,

    @field:Schema(description = "상대 팀 이름", example = "강남 FC", nullable = true)
    val opponentTeamName: String? = null,

    @field:Schema(description = "매치 일시", example = "2026-08-01T19:30:00", requiredMode = Schema.RequiredMode.REQUIRED)
    val matchAt: LocalDateTime,

    @field:Schema(description = "경기 장소", example = "잠실 풋살장", nullable = true)
    val location: String? = null,
)
