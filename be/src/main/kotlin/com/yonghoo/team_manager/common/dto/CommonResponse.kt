package com.yonghoo.team_manager.common.dto

data class CommonResponse<T>(
    val success: Boolean = true,
    val data: T? = null,
)
