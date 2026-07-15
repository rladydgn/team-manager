package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchRecord
import com.yonghoo.team_manager.match.domain.MatchStatus
import com.yonghoo.team_manager.match.domain.MatchType
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDateTime

@Schema(description = "매치 응답")
data class MatchResponse(
    @field:Schema(description = "매치 ID", example = "1")
    val id: Long,

    @field:Schema(description = "우리 팀 ID", example = "1")
    val teamId: Long,

    @field:Schema(description = "매치 유형", example = "EXTERNAL")
    val matchType: MatchType,

    @field:Schema(description = "상대 팀 ID", example = "2", nullable = true)
    val opponentTeamId: Long?,

    @field:Schema(description = "상대 팀 이름", example = "강남 FC", nullable = true)
    val opponentTeamName: String?,

    @field:Schema(description = "생성 유저 ID", example = "1")
    val createdByUserId: Long,

    @field:Schema(description = "매치 일시", example = "2026-08-01T19:30:00")
    val matchAt: LocalDateTime,

    @field:Schema(description = "경기 장소", example = "잠실 풋살장", nullable = true)
    val location: String?,

    @field:Schema(description = "매치 상태", example = "SCHEDULED")
    val status: MatchStatus,

    @field:Schema(description = "생성일시", example = "2026-07-15T20:00:00")
    val createdAt: LocalDateTime,
) {
    companion object {
        fun from(match: MatchRecord): MatchResponse {
            return MatchResponse(
                id = match.id,
                teamId = match.teamId,
                matchType = match.matchType,
                opponentTeamId = match.opponentTeamId,
                opponentTeamName = match.opponentTeamName,
                createdByUserId = match.createdByUserId,
                matchAt = match.matchAt,
                location = match.location,
                status = match.status,
                createdAt = match.createdAt,
            )
        }
    }
}
