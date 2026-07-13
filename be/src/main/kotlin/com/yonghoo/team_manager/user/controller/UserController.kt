package com.yonghoo.team_manager.user.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.user.dto.UserLoginRequest
import com.yonghoo.team_manager.user.dto.UserLoginResponse
import com.yonghoo.team_manager.user.dto.UserRegisterRequest
import com.yonghoo.team_manager.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users")
class UserController(
    private val userService: UserService,
) {
    @Operation(
        summary = "회원가입",
        description = "아이디와 비밀번호로 신규 유저를 생성합니다.",
    )
    @PostMapping("/sign-up")
    fun registerUser(
        @RequestBody request: UserRegisterRequest,
    ): ResponseEntity<CommonResponse<Nothing>> {
        userService.registerUser(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(CommonResponse())
    }

    @Operation(
        summary = "아이디 중복 확인",
        description = "아이디 형식과 중복 여부를 확인합니다. 사용 가능하면 true를 반환합니다.",
    )
    @GetMapping("/id/check")
    fun checkUsername(
        @RequestParam id: String,
    ): ResponseEntity<CommonResponse<Boolean>> {
        return ResponseEntity.ok(CommonResponse(data = userService.isValidUsername(id)))
    }

    @Operation(
        summary = "로그인",
        description = "아이디와 비밀번호를 검증하고 유저 정보를 반환합니다.",
    )
    @PostMapping("/sign-in")
    fun signIn(
        @RequestBody request: UserLoginRequest,
    ): ResponseEntity<CommonResponse<UserLoginResponse>> {
        return ResponseEntity.ok(CommonResponse(data = userService.signIn(request)))
    }
}
