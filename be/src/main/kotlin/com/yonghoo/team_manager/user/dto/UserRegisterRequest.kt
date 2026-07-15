package com.yonghoo.team_manager.user.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "회원가입 요청")
data class UserRegisterRequest(
    @field:Schema(description = "팀원 목록과 경기 기록에 표시할 이름", example = "홍길동", requiredMode = Schema.RequiredMode.REQUIRED)
    val name: String,

    @field:Schema(description = "로그인에 사용할 아이디", example = "user_01", requiredMode = Schema.RequiredMode.REQUIRED)
    val username: String,

    @field:Schema(description = "로그인에 사용할 비밀번호", example = "Password1!", requiredMode = Schema.RequiredMode.REQUIRED)
    val password: String,

    @field:Schema(description = "이메일", example = "user@example.com", nullable = true)
    val email: String? = null,
)
