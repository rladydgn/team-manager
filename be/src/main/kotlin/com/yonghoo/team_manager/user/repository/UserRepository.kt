package com.yonghoo.team_manager.user.repository

import com.yonghoo.team_manager.user.domain.UserEntity
import com.yonghoo.team_manager.user.domain.UserRecord
import com.yonghoo.team_manager.user.domain.UsersTable
import com.yonghoo.team_manager.user.dto.UserRegisterRequest
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class UserRepository {
    fun createUser(
        request: UserRegisterRequest,
        passwordHash: String,
    ): UserRecord {
        val user = UserEntity.new {
            username = request.username
            this.passwordHash = passwordHash
            name = request.name.trim()
            email = request.email
        }
        return UserRecord.from(user)
    }

    fun selectUserByUsername(username: String): UserRecord? {
        return UserEntity.find {
            (UsersTable.username eq username) and UsersTable.deletedAt.isNull()
        }.firstOrNull()?.let(UserRecord::from)
    }

    fun selectUserById(userId: Long): UserRecord? {
        return UserEntity.find {
            (UsersTable.id eq userId) and UsersTable.deletedAt.isNull()
        }.firstOrNull()?.let(UserRecord::from)
    }

    fun existsByUsername(username: String): Boolean {
        return UserEntity.find {
            (UsersTable.username eq username) and UsersTable.deletedAt.isNull()
        }.empty().not()
    }

    fun existsById(userId: Long): Boolean {
        return UserEntity.find {
            (UsersTable.id eq userId) and UsersTable.deletedAt.isNull()
        }.empty().not()
    }

    fun updateLastLoginAt(
        userId: Long,
        lastLoginAt: LocalDateTime,
    ): UserRecord {
        val user = UserEntity[userId]
        user.lastLoginAt = lastLoginAt
        user.updatedAt = LocalDateTime.now()
        return UserRecord.from(user)
    }
}
