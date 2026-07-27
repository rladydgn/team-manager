package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamMemberRecord
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamMemberStatus
import java.time.LocalDateTime

data class TeamMemberResponse(
    val id: Long,
    val userId: Long?,
    val name: String,
    val memo: String?,
    val role: TeamMemberRole,
    val status: TeamMemberStatus,
    val joinedAt: LocalDateTime?,
    val requestedAt: LocalDateTime,
) {
    companion object {
        fun from(
            member: TeamMemberRecord,
        ): TeamMemberResponse {
            return TeamMemberResponse(
                id = member.id,
                userId = member.userId,
                name = member.displayName,
                memo = member.memo,
                role = member.role,
                status = member.status,
                joinedAt = member.joinedAt,
                requestedAt = member.updatedAt,
            )
        }
    }
}
