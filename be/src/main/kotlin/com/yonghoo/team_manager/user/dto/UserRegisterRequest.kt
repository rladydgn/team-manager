package com.yonghoo.team_manager.user.dto

data class UserRegisterRequest(
    val name: String,
    val username: String,
    val password: String,
    val email: String,
)
