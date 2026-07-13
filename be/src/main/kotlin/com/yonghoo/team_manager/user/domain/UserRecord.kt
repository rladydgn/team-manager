package com.yonghoo.team_manager.user.domain

import java.time.LocalDateTime

data class UserRecord(
    val id: Long,
    val username: String,
    val passwordHash: String,
    val email: String?,
    val status: UserStatus,
    val lastLoginAt: LocalDateTime?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    val deletedAt: LocalDateTime?,
) {
    companion object {
        fun from(user: UserEntity): UserRecord {
            return UserRecord(
                id = user.id.value,
                username = user.username,
                passwordHash = user.passwordHash,
                email = user.email,
                status = user.status,
                lastLoginAt = user.lastLoginAt,
                createdAt = user.createdAt,
                updatedAt = user.updatedAt,
                deletedAt = user.deletedAt,
            )
        }
    }
}
