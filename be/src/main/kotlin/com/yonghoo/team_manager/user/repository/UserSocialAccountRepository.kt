package com.yonghoo.team_manager.user.repository

import com.yonghoo.team_manager.user.domain.SocialProvider
import com.yonghoo.team_manager.user.domain.UserSocialAccountEntity
import com.yonghoo.team_manager.user.domain.UserSocialAccountsTable
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository

@Repository
class UserSocialAccountRepository {
    fun existsByUserId(userId: Long, provider: SocialProvider): Boolean {
        return UserSocialAccountEntity.find {
            (UserSocialAccountsTable.userId eq userId) and
                (UserSocialAccountsTable.provider eq provider) and
                UserSocialAccountsTable.deletedAt.isNull()
        }.empty().not()
    }

    fun selectUserId(provider: SocialProvider, providerUserId: String): Long? {
        return UserSocialAccountEntity.find {
            (UserSocialAccountsTable.provider eq provider) and
                (UserSocialAccountsTable.providerUserId eq providerUserId) and
                UserSocialAccountsTable.deletedAt.isNull()
        }.firstOrNull()?.userId
    }

    fun create(
        userId: Long,
        provider: SocialProvider,
        providerUserId: String,
        providerEmail: String?,
    ) {
        UserSocialAccountEntity.new {
            this.userId = userId
            this.provider = provider
            this.providerUserId = providerUserId
            this.providerEmail = providerEmail
        }
    }
}
