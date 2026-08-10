package com.yonghoo.team_manager.team.dto

import com.yonghoo.team_manager.team.domain.TeamMemberRole

data class TeamMemberRoleUpdateRequest(
    val role: TeamMemberRole,
)
