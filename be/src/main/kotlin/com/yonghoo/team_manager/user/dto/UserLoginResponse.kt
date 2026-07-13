package com.yonghoo.team_manager.user.dto

import com.yonghoo.team_manager.user.domain.UserRecord
import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "로그인 응답")
data class UserLoginResponse(
    @field:Schema(description = "유저 ID", example = "1")
    val id: Long,

    @field:Schema(description = "아이디", example = "user_01")
    val username: String,

    @field:Schema(description = "이메일", example = "user@example.com", nullable = true)
    val email: String?,
) {
    companion object {
        fun from(user: UserRecord): UserLoginResponse {
            return UserLoginResponse(
                id = user.id,
                username = user.username,
                email = user.email,
            )
        }
    }
}
