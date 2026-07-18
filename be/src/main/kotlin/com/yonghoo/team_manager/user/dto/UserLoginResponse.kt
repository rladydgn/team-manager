package com.yonghoo.team_manager.user.dto

import com.yonghoo.team_manager.user.domain.UserRecord

data class UserLoginResponse(
    val id: Long,
    val username: String,
    val name: String,
    val email: String,
    val accessToken: String,
) {
    companion object {
        fun from(
            user: UserRecord,
            accessToken: String,
        ): UserLoginResponse {
            return UserLoginResponse(
                id = user.id,
                username = user.username,
                name = user.name,
                email = user.email,
                accessToken = accessToken,
            )
        }
    }
}
