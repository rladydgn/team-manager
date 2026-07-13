package com.yonghoo.team_manager.user.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "로그인 요청")
data class UserLoginRequest(
    @field:Schema(description = "아이디", example = "user_01", requiredMode = Schema.RequiredMode.REQUIRED)
    val username: String,

    @field:Schema(description = "비밀번호", example = "Password1!", requiredMode = Schema.RequiredMode.REQUIRED)
    val password: String,
)
