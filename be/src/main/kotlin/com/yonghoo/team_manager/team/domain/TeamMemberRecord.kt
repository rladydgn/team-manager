package com.yonghoo.team_manager.team.domain

import java.time.LocalDateTime

data class TeamMemberRecord(
    val id: Long,
    val teamId: Long,
    val userId: Long?,
    val role: TeamMemberRole,
    val status: TeamMemberStatus,
    val joinedAt: LocalDateTime?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val deletedAt: LocalDateTime?,
) {
    companion object {
        fun from(teamMember: TeamMemberEntity): TeamMemberRecord {
            return TeamMemberRecord(
                id = teamMember.id.value,
                teamId = teamMember.teamId,
                userId = teamMember.userId,
                role = teamMember.role,
                status = teamMember.status,
                joinedAt = teamMember.joinedAt,
                createdAt = teamMember.createdAt,
                updatedAt = teamMember.updatedAt,
                deletedAt = teamMember.deletedAt,
            )
        }
    }
}
