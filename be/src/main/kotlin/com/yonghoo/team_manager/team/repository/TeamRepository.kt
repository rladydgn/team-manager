package com.yonghoo.team_manager.team.repository

import com.yonghoo.team_manager.team.domain.TeamEntity
import com.yonghoo.team_manager.team.domain.TeamHistoryAction
import com.yonghoo.team_manager.team.domain.TeamHistoryEntity
import com.yonghoo.team_manager.team.domain.TeamMemberEntity
import com.yonghoo.team_manager.team.domain.TeamMemberRecord
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamMemberStatus
import com.yonghoo.team_manager.team.domain.TeamMembersTable
import com.yonghoo.team_manager.team.domain.TeamRecord
import com.yonghoo.team_manager.team.domain.TeamStatus
import com.yonghoo.team_manager.team.domain.TeamsTable
import com.yonghoo.team_manager.team.dto.TeamCreateRequest
import com.yonghoo.team_manager.team.dto.TeamUpdateRequest
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class TeamRepository {
    fun createTeam(
        createdByUserId: Long,
        request: TeamCreateRequest,
    ): TeamRecord {
        val now = LocalDateTime.now()
        val team = TeamEntity.new {
            this.createdByUserId = createdByUserId
            name = request.name
            shortName = request.shortName
            logoUrl = request.logoUrl
            description = request.description
            region = request.region
            homeStadium = request.homeStadium
            foundedAt = request.foundedAt
            teamColor = request.teamColor
            status = TeamStatus.ACTIVE
            createdAt = now
            updatedAt = now
        }
        return TeamRecord.from(team)
    }

    fun updateTeam(
        teamId: Long,
        request: TeamUpdateRequest,
    ): TeamRecord {
        val team = TeamEntity[teamId]

        team.name = request.name.trim()
        team.shortName = request.shortName.cleanOptional()
        team.logoUrl = request.logoUrl.cleanOptional()
        team.description = request.description.cleanOptional()
        team.region = request.region.cleanOptional()
        team.homeStadium = request.homeStadium.cleanOptional()
        team.foundedAt = request.foundedAt
        team.teamColor = request.teamColor.cleanOptional()
        team.updatedAt = LocalDateTime.now()

        return TeamRecord.from(team)
    }

    fun createTeamHistory(
        teamId: Long,
        action: TeamHistoryAction,
        changedByUserId: Long,
        beforeSnapshot: String,
        afterSnapshot: String?,
    ) {
        TeamHistoryEntity.new {
            this.teamId = teamId
            this.action = action
            this.changedByUserId = changedByUserId
            this.beforeSnapshot = beforeSnapshot
            this.afterSnapshot = afterSnapshot
            createdAt = LocalDateTime.now()
        }
    }

    fun softDeleteTeam(teamId: Long) {
        val now = LocalDateTime.now()
        val team = TeamEntity[teamId]

        team.status = TeamStatus.INACTIVE
        team.deletedAt = now
        team.updatedAt = now
    }

    fun createTeamMember(
        teamId: Long,
        userId: Long?,
        role: TeamMemberRole,
    ): TeamMemberRecord {
        val now = LocalDateTime.now()
        val teamMember = TeamMemberEntity.new {
            this.teamId = teamId
            this.userId = userId
            this.role = role
            status = TeamMemberStatus.ACTIVE
            joinedAt = now
            createdAt = now
            updatedAt = now
        }
        return TeamMemberRecord.from(teamMember)
    }

    fun selectTeams(): List<TeamRecord> {
        return TeamEntity.find {
            (TeamsTable.status eq TeamStatus.ACTIVE) and TeamsTable.deletedAt.isNull()
        }.map(TeamRecord::from)
    }

    fun selectTeamById(teamId: Long): TeamRecord? {
        return TeamEntity.find {
            (TeamsTable.id eq teamId) and
                (TeamsTable.status eq TeamStatus.ACTIVE) and
                TeamsTable.deletedAt.isNull()
        }.firstOrNull()?.let(TeamRecord::from)
    }

    fun selectMembersByTeamId(teamId: Long): List<TeamMemberRecord> {
        return TeamMemberEntity.find {
            (TeamMembersTable.teamId eq teamId) and
                (TeamMembersTable.status eq TeamMemberStatus.ACTIVE) and
                TeamMembersTable.deletedAt.isNull()
        }.map(TeamMemberRecord::from)
    }

    fun existsActiveMember(
        teamId: Long,
        userId: Long,
    ): Boolean {
        return TeamMemberEntity.find {
            (TeamMembersTable.teamId eq teamId) and
                (TeamMembersTable.userId eq userId) and
                (TeamMembersTable.status eq TeamMemberStatus.ACTIVE) and
                TeamMembersTable.deletedAt.isNull()
        }.empty().not()
    }

    fun selectActiveMemberRole(
        teamId: Long,
        userId: Long,
    ): TeamMemberRole? {
        return TeamMemberEntity.find {
            (TeamMembersTable.teamId eq teamId) and
                (TeamMembersTable.userId eq userId) and
                (TeamMembersTable.status eq TeamMemberStatus.ACTIVE) and
                TeamMembersTable.deletedAt.isNull()
        }.firstOrNull()?.role
    }

    private fun String?.cleanOptional(): String? {
        return this?.trim()?.takeIf(String::isNotBlank)
    }
}
