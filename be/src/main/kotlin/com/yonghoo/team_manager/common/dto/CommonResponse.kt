package com.yonghoo.team_manager.common.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "공통 API 응답")
data class CommonResponse<T>(
    @field:Schema(description = "요청 성공 여부", example = "true")
    val success: Boolean = true,

    @field:Schema(description = "응답 데이터")
    val data: T? = null,
)
