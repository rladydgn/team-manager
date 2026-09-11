package com.yonghoo.team_manager.user.domain

import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.dao.LongEntity
import org.jetbrains.exposed.v1.dao.LongEntityClass

class UserSocialAccountEntity(id: EntityID<Long>) : LongEntity(id) {
    companion object : LongEntityClass<UserSocialAccountEntity>(UserSocialAccountsTable)

    var userId by UserSocialAccountsTable.userId
    var provider by UserSocialAccountsTable.provider
    var providerUserId by UserSocialAccountsTable.providerUserId
    var providerEmail by UserSocialAccountsTable.providerEmail
    var createdAt by UserSocialAccountsTable.createdAt
    var updatedAt by UserSocialAccountsTable.updatedAt
    var deletedAt by UserSocialAccountsTable.deletedAt
}
