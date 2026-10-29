package com.yonghoo.team_manager.team.repository

import com.yonghoo.team_manager.team.domain.*
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.jdbc.*
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class TeamImageRepository {
    fun lockTeam(teamId: Long): Boolean = TeamsTable.selectAll().where {
        (TeamsTable.id eq teamId) and (TeamsTable.status eq TeamStatus.ACTIVE) and TeamsTable.deletedAt.isNull()
    }.forUpdate().toList().isNotEmpty()

    fun managerRole(teamId: Long, userId: Long): TeamMemberRole? = TeamMembersTable.selectAll().where {
        (TeamMembersTable.teamId eq teamId) and (TeamMembersTable.userId eq userId) and
            (TeamMembersTable.status eq TeamMemberStatus.ACTIVE) and TeamMembersTable.deletedAt.isNull()
    }.forUpdate().firstOrNull()?.get(TeamMembersTable.role)

    fun list(teamId: Long, locking: Boolean = false): List<TeamImageRecord> {
        val query = TeamImagesTable.selectAll().where {
            (TeamImagesTable.teamId eq teamId) and TeamImagesTable.deletedAt.isNull()
        }.orderBy(TeamImagesTable.sortOrder to SortOrder.ASC, TeamImagesTable.id to SortOrder.ASC)
        // Use a current read after the parent lock, including under MySQL REPEATABLE READ.
        if (locking) query.forUpdate()
        return query.map {
            TeamImageRecord(it[TeamImagesTable.id].value, it[TeamImagesTable.teamId], it[TeamImagesTable.imagePath],
                it[TeamImagesTable.originalFileName], it[TeamImagesTable.fileSizeBytes], it[TeamImagesTable.sortOrder],
                it[TeamImagesTable.createdByUserId], it[TeamImagesTable.createdAt])
        }
    }

    fun create(teamId: Long, userId: Long, imagePath: String, originalFileName: String, size: Int, order: Int): Long =
        TeamImagesTable.insertAndGetId {
            it[this.teamId] = teamId
            it[this.imagePath] = imagePath
            it[this.originalFileName] = originalFileName
            it[fileSizeBytes] = size
            it[sortOrder] = order
            it[createdByUserId] = userId
        }.value

    fun delete(teamId: Long, imageId: Long) {
        TeamImagesTable.update({ (TeamImagesTable.teamId eq teamId) and (TeamImagesTable.id eq imageId) and TeamImagesTable.deletedAt.isNull() }) {
            it[deletedAt] = LocalDateTime.now()
        }
    }

    fun reorder(teamId: Long, imageIds: List<Long>) {
        imageIds.forEachIndexed { index, imageId ->
            TeamImagesTable.update({ (TeamImagesTable.teamId eq teamId) and (TeamImagesTable.id eq imageId) and TeamImagesTable.deletedAt.isNull() }) {
                it[sortOrder] = index
            }
        }
    }
}
