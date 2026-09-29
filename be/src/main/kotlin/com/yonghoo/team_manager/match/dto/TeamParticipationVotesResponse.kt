package com.yonghoo.team_manager.match.dto

import com.yonghoo.team_manager.match.domain.MatchParticipantStatus
import com.yonghoo.team_manager.match.domain.MatchType
import java.time.LocalDate
import java.time.LocalDateTime

data class TeamParticipationVotesResponse(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val matches: List<TeamParticipationMatchResponse>,
    val members: List<TeamParticipationMemberResponse>,
    val page: Int,
    val pageSize: Int,
    val totalElements: Int,
    val totalPages: Int,
)

data class TeamParticipationMatchResponse(
    val id: Long,
    val matchAt: LocalDateTime,
    val matchType: MatchType,
    val opponentTeamName: String?,
    val isTraining: Boolean,
)

data class TeamParticipationMemberResponse(
    val teamMemberId: Long,
    val name: String,
    // 경기 ID별 투표 상태. 키가 없으면 해당 경기의 참가 명단에 없는 선수입니다.
    val votes: Map<Long, MatchParticipantStatus>,
)
