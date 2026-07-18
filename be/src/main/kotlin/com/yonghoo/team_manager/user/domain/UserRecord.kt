package com.yonghoo.team_manager.user.domain

import java.time.LocalDateTime
import java.time.LocalDate

data class UserRecord(
    val id: Long,
    val username: String,
    val passwordHash: String,
    val name: String,
    val birthDate: LocalDate,
    val email: String,
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
                name = user.name,
                birthDate = user.birthDate,
                email = requireNotNull(user.email),
                status = user.status,
                lastLoginAt = user.lastLoginAt,
                createdAt = user.createdAt,
                updatedAt = user.updatedAt,
                deletedAt = user.deletedAt,
            )
        }
    }
}
