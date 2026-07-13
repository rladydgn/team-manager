package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamRecord
import com.yonghoo.team_manager.team.domain.TeamStatus
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDate
import java.time.LocalDateTime

@Schema(description = "팀 응답")
data class TeamResponse(
    @field:Schema(description = "팀 ID", example = "1")
    val id: Long,

    @field:Schema(description = "팀 생성 유저 ID", example = "1")
    val createdByUserId: Long,

    @field:Schema(description = "팀 이름", example = "서울 FC")
    val name: String,

    @field:Schema(description = "팀 짧은 이름", example = "SFC", nullable = true)
    val shortName: String?,

    @field:Schema(description = "팀 로고 URL", example = "https://example.com/logo.png", nullable = true)
    val logoUrl: String?,

    @field:Schema(description = "팀 소개", example = "주말마다 풋살을 즐기는 팀입니다.", nullable = true)
    val description: String?,

    @field:Schema(description = "활동 지역", example = "서울", nullable = true)
    val region: String?,

    @field:Schema(description = "홈 구장", example = "잠실 풋살장", nullable = true)
    val homeStadium: String?,

    @field:Schema(description = "창단일", example = "2026-07-13", nullable = true)
    val foundedAt: LocalDate?,

    @field:Schema(description = "팀 색상", example = "#0F766E", nullable = true)
    val teamColor: String?,

    @field:Schema(description = "팀 상태", example = "ACTIVE")
    val status: TeamStatus,

    @field:Schema(description = "생성일시", example = "2026-07-13T21:00:00")
    val createdAt: LocalDateTime,

    @field:Schema(description = "수정일시", example = "2026-07-13T21:00:00")
    val updatedAt: LocalDateTime,
) {
    companion object {
        fun from(team: TeamRecord): TeamResponse {
            return TeamResponse(
                id = team.id,
                createdByUserId = team.createdByUserId,
                name = team.name,
                shortName = team.shortName,
                logoUrl = team.logoUrl,
                description = team.description,
                region = team.region,
                homeStadium = team.homeStadium,
                foundedAt = team.foundedAt,
                teamColor = team.teamColor,
                status = team.status,
                createdAt = team.createdAt,
                updatedAt = team.updatedAt,
            )
        }
    }
}
