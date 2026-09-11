package com.yonghoo.team_manager.user.dto

data class UserProfileResponse(
    val id: Long,
    val name: String,
    val username: String,
    val birthDate: String?,
    val email: String?,
    val kakaoLinked: Boolean,
)
