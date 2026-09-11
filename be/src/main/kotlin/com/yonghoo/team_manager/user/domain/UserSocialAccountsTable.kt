package com.yonghoo.team_manager.user.domain

import org.jetbrains.exposed.v1.core.dao.id.LongIdTable
import org.jetbrains.exposed.v1.javatime.datetime
import java.time.LocalDateTime

object UserSocialAccountsTable : LongIdTable("user_social_accounts") {
    val userId = long("user_id")
    val provider = enumerationByName("provider", 20, SocialProvider::class)
    val providerUserId = varchar("provider_user_id", 100)
    val providerEmail = varchar("provider_email", 255).nullable()
    val createdAt = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt = datetime("updated_at").clientDefault { LocalDateTime.now() }
    val deletedAt = datetime("deleted_at").nullable()
}
