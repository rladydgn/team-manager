package com.yonghoo.team_manager.user.dto

data class UserSignInResult(
    val response: UserLoginResponse,
    val refreshToken: String,
)
