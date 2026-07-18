package com.yonghoo.team_manager.user.dto

import java.time.LocalDate

data class UserRegisterRequest(
    val name: String,
    val birthDate: LocalDate,
    val username: String,
    val password: String,
    val email: String,
)
