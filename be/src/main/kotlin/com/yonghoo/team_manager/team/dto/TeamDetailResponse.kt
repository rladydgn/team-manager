package com.yonghoo.team_manager.team.dto

data class TeamDetailResponse(
    val team: TeamResponse,
    val members: List<TeamMemberResponse>,
)
