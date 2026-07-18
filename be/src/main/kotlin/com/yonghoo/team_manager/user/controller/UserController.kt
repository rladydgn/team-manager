package com.yonghoo.team_manager.user.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.user.auth.JwtProperties
import com.yonghoo.team_manager.user.dto.UserLoginRequest
import com.yonghoo.team_manager.user.dto.UserLoginResponse
import com.yonghoo.team_manager.user.dto.UserRegisterRequest
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.service.UserService
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.HttpStatus
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CookieValue
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
    private val jwtProperties: JwtProperties,
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

    @GetMapping("/email/check")
    fun checkEmail(
        @RequestParam email: String,
    ): ResponseEntity<CommonResponse<Boolean>> {
        return ResponseEntity.ok(CommonResponse(data = userService.isValidEmail(email)))
    }

    @Operation(
        summary = "로그인",
        description = "아이디와 비밀번호를 검증하고 액세스 토큰을 반환하며 리프레시 토큰을 HttpOnly 쿠키로 설정합니다.",
    )
    @PostMapping("/sign-in")
    fun signIn(
        @RequestBody request: UserLoginRequest,
    ): ResponseEntity<CommonResponse<UserLoginResponse>> {
        val result = userService.signIn(request)

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, createRefreshCookie(result.refreshToken).toString())
            .body(CommonResponse(data = result.response))
    }

    @PostMapping("/sign-out")
    fun signOut(): ResponseEntity<CommonResponse<Nothing>> {
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
            .body(CommonResponse())
    }

    @Operation(
        summary = "액세스 토큰 재발급",
        description = "HttpOnly 리프레시 쿠키를 검증해 새 액세스 토큰을 발급합니다.",
    )
    @PostMapping("/token/refresh")
    fun refreshAccessToken(
        @CookieValue(name = REFRESH_TOKEN_COOKIE_NAME, required = false) refreshToken: String?,
    ): ResponseEntity<CommonResponse<UserLoginResponse>> {
        if (refreshToken.isNullOrBlank()) {
            throw ApiException(UserErrorCode.INVALID_REFRESH_TOKEN)
        }

        return ResponseEntity.ok(
            CommonResponse(data = userService.refreshAccessToken(refreshToken)),
        )
    }

    private fun createRefreshCookie(refreshToken: String): ResponseCookie {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(jwtProperties.refreshTokenExpiration)
            .build()
    }

    private fun clearRefreshCookie(): ResponseCookie {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite("Lax")
            .path("/")
            .maxAge(0)
            .build()
    }

    companion object {
        private const val REFRESH_TOKEN_COOKIE_NAME = "team_manager_refresh_token"
    }
}
