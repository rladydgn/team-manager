package com.yonghoo.team_manager.user.domain

import org.jetbrains.exposed.dao.LongEntity
import org.jetbrains.exposed.dao.LongEntityClass
import org.jetbrains.exposed.dao.id.EntityID

class UserEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<UserEntity>(UsersTable)

    var username by UsersTable.username
    var passwordHash by UsersTable.passwordHash
    var email by UsersTable.email
    var status by UsersTable.status
    var lastLoginAt by UsersTable.lastLoginAt
    var createdAt by UsersTable.createdAt
    var updatedAt by UsersTable.updatedAt
    var deletedAt by UsersTable.deletedAt
}
