package com.yonghoo.team_manager.team.repository

import com.yonghoo.team_manager.team.domain.TeamEntity
import com.yonghoo.team_manager.team.domain.TeamMemberEntity
import com.yonghoo.team_manager.team.domain.TeamMemberRecord
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamMemberStatus
import com.yonghoo.team_manager.team.domain.TeamMembersTable
import com.yonghoo.team_manager.team.domain.TeamRecord
import com.yonghoo.team_manager.team.domain.TeamStatus
import com.yonghoo.team_manager.team.domain.TeamsTable
import com.yonghoo.team_manager.team.dto.TeamCreateRequest
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class TeamRepository {
    fun createTeam(request: TeamCreateRequest): TeamRecord {
        val now = LocalDateTime.now()
        val team = TeamEntity.new {
            createdByUserId = request.createdByUserId
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

    fun createTeamMember(
        teamId: Long,
        userId: Long,
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
}
