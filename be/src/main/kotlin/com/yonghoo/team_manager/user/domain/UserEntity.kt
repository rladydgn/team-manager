package com.yonghoo.team_manager.user.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass
import java.time.LocalDate

class UserEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<UserEntity>(UsersTable)

    var username by UsersTable.username
    var passwordHash: String? by UsersTable.passwordHash
    var name by UsersTable.name
    var birthDate: LocalDate? by UsersTable.birthDate
    var email: String? by UsersTable.email
    var status by UsersTable.status
    var lastLoginAt by UsersTable.lastLoginAt
    var createdAt by UsersTable.createdAt
    var updatedAt by UsersTable.updatedAt
    var deletedAt by UsersTable.deletedAt
}
