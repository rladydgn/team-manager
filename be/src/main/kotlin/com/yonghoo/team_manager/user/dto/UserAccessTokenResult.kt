package com.yonghoo.team_manager.user.dto

data class UserAccessTokenResult(
    val response: UserLoginResponse,
    val accessToken: String,
)
