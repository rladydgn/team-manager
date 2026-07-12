package com.yonghoo.team_manager.exception.dto

data class ErrorResponse(
    val status: Int,
    val code: String,
    val message: String,
)
