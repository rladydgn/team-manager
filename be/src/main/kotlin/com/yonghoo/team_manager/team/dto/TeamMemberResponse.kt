package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamMemberRecord
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamMemberStatus
import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDateTime

@Schema(description = "팀 멤버 응답")
data class TeamMemberResponse(
    @field:Schema(description = "팀 멤버 ID", example = "1")
    val id: Long,

    @field:Schema(description = "유저 ID", example = "1")
    val userId: Long?,

    @field:Schema(description = "서비스 가입 유저 이름", example = "홍길동", nullable = true)
    val name: String?,

    @field:Schema(description = "팀 권한(OWNER, SUB_MANAGER, MEMBER, GUEST)", example = "MEMBER")
    val role: TeamMemberRole,

    @field:Schema(description = "가입 상태", example = "ACTIVE")
    val status: TeamMemberStatus,

    @field:Schema(description = "가입일시", example = "2026-07-13T21:00:00", nullable = true)
    val joinedAt: LocalDateTime?,
) {
    companion object {
        fun from(
            member: TeamMemberRecord,
            name: String? = null,
        ): TeamMemberResponse {
            return TeamMemberResponse(
                id = member.id,
                userId = member.userId,
                name = name,
                role = member.role,
                status = member.status,
                joinedAt = member.joinedAt,
            )
        }
    }
}
