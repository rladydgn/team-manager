package com.yonghoo.team_manager.user.oauth

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.user.auth.ACCESS_TOKEN_COOKIE_NAME
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.auth.JwtProperties
import com.yonghoo.team_manager.user.auth.REFRESH_TOKEN_COOKIE_NAME
import com.yonghoo.team_manager.user.dto.UserLoginResponse
import com.yonghoo.team_manager.user.dto.UserSignInResult
import com.yonghoo.team_manager.user.exception.UserErrorCode
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.slf4j.LoggerFactory
import org.springframework.web.bind.annotation.CookieValue
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestAttribute
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.net.URI
import java.time.Duration
import java.util.UUID

@RestController
@RequestMapping("/oauth/kakao")
class KakaoOAuthController(
    private val kakaoOAuthService: KakaoOAuthService,
    private val kakaoProperties: KakaoOAuthProperties,
    private val jwtProperties: JwtProperties,
    private val kakaoLinkTokenProvider: KakaoLinkTokenProvider,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @GetMapping("/authorize")
    fun authorize(): ResponseEntity<Void> {
        val state = UUID.randomUUID().toString()
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(kakaoOAuthService.createAuthorizationUrl(state)))
            .header(HttpHeaders.SET_COOKIE, createStateCookie(state).toString())
            .header(HttpHeaders.SET_COOKIE, clearPendingRegistrationCookie().toString())
            .header(HttpHeaders.SET_COOKIE, clearLinkCookie().toString())
            .build()
    }

    @GetMapping("/link/authorize")
    fun authorizeLink(
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
    ): ResponseEntity<Void> {
        val authenticatedUserId = userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
        val state = UUID.randomUUID().toString()
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(URI.create(kakaoOAuthService.createAuthorizationUrl(state)))
            .header(HttpHeaders.SET_COOKIE, createStateCookie(state).toString())
            .header(HttpHeaders.SET_COOKIE, clearPendingRegistrationCookie().toString())
            .header(
                HttpHeaders.SET_COOKIE,
                createLinkCookie(kakaoLinkTokenProvider.createToken(authenticatedUserId)).toString(),
            )
            .build()
    }

    @GetMapping("/callback")
    fun callback(
        @RequestParam(required = false) code: String?,
        @RequestParam(required = false) state: String?,
        @RequestParam(required = false) error: String?,
        @CookieValue(name = STATE_COOKIE_NAME, required = false) expectedState: String?,
        @CookieValue(name = LINK_COOKIE_NAME, required = false) linkToken: String?,
    ): ResponseEntity<Void> {
        if (error != null || code.isNullOrBlank() || state.isNullOrBlank() || state != expectedState) {
            return if (linkToken.isNullOrBlank()) redirectToLoginFailure() else redirectToProfileLinkFailure()
        }

        return try {
            if (!linkToken.isNullOrBlank()) {
                val linkUserId = kakaoLinkTokenProvider.parseUserId(linkToken)
                kakaoOAuthService.linkAccount(code, linkUserId)
                redirectToProfileLinkSuccess()
            } else {
                when (val result = kakaoOAuthService.signIn(code)) {
                    is KakaoSignInResult.SignedIn -> createSignedInRedirect(result.result)
                    is KakaoSignInResult.RegistrationRequired -> ResponseEntity.status(HttpStatus.FOUND)
                        .location(frontendUri("/sign-up/kakao"))
                        .header(HttpHeaders.SET_COOKIE, clearStateCookie().toString())
                        .header(
                            HttpHeaders.SET_COOKIE,
                            createPendingRegistrationCookie(result.pendingRegistrationToken).toString(),
                        )
                        .build()
                }
            }
        } catch (exception: Exception) {
            log.warn("Kakao OAuth callback failed: {}", exception.message)
            if (linkToken.isNullOrBlank()) redirectToLoginFailure() else redirectToProfileLinkFailure()
        }
    }

    @PostMapping("/register")
    fun register(
        @RequestBody request: KakaoSignUpRequest,
        @CookieValue(name = PENDING_REGISTRATION_COOKIE_NAME, required = false) pendingToken: String?,
    ): ResponseEntity<CommonResponse<UserLoginResponse>> {
        if (pendingToken.isNullOrBlank()) {
            throw ApiException(UserErrorCode.KAKAO_LOGIN_FAILED)
        }

        val result = kakaoOAuthService.completeSignUp(request.username, pendingToken)
        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, clearPendingRegistrationCookie().toString())
            .header(HttpHeaders.SET_COOKIE, createAuthCookie(ACCESS_TOKEN_COOKIE_NAME, result.accessToken, jwtProperties.accessTokenExpiration).toString())
            .header(HttpHeaders.SET_COOKIE, createAuthCookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, jwtProperties.refreshTokenExpiration).toString())
            .body(CommonResponse(data = result.response))
    }

    private fun createSignedInRedirect(result: UserSignInResult): ResponseEntity<Void> {
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(frontendUri("/team"))
            .header(HttpHeaders.SET_COOKIE, clearStateCookie().toString())
            .header(HttpHeaders.SET_COOKIE, clearPendingRegistrationCookie().toString())
            .header(HttpHeaders.SET_COOKIE, clearLinkCookie().toString())
            .header(HttpHeaders.SET_COOKIE, createAuthCookie(ACCESS_TOKEN_COOKIE_NAME, result.accessToken, jwtProperties.accessTokenExpiration).toString())
            .header(HttpHeaders.SET_COOKIE, createAuthCookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, jwtProperties.refreshTokenExpiration).toString())
            .build()
    }

    private fun redirectToLoginFailure(): ResponseEntity<Void> {
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(frontendUri("/login?oauthError=kakao"))
            .header(HttpHeaders.SET_COOKIE, clearStateCookie().toString())
            .header(HttpHeaders.SET_COOKIE, clearPendingRegistrationCookie().toString())
            .header(HttpHeaders.SET_COOKIE, clearLinkCookie().toString())
            .build()
    }

    private fun redirectToProfileLinkSuccess(): ResponseEntity<Void> {
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(frontendUri("/profile?linked=kakao"))
            .header(HttpHeaders.SET_COOKIE, clearStateCookie().toString())
            .header(HttpHeaders.SET_COOKIE, clearLinkCookie().toString())
            .build()
    }

    private fun redirectToProfileLinkFailure(): ResponseEntity<Void> {
        return ResponseEntity.status(HttpStatus.FOUND)
            .location(frontendUri("/profile?linkError=kakao"))
            .header(HttpHeaders.SET_COOKIE, clearStateCookie().toString())
            .header(HttpHeaders.SET_COOKIE, clearLinkCookie().toString())
            .build()
    }

    private fun createStateCookie(state: String): ResponseCookie {
        return ResponseCookie.from(STATE_COOKIE_NAME, state)
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite(jwtProperties.cookieSameSite)
            .path("/")
            .maxAge(STATE_EXPIRATION)
            .build()
    }

    private fun clearStateCookie(): ResponseCookie {
        return ResponseCookie.from(STATE_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite(jwtProperties.cookieSameSite)
            .path("/")
            .maxAge(Duration.ZERO)
            .build()
    }

    private fun createPendingRegistrationCookie(token: String): ResponseCookie {
        return ResponseCookie.from(PENDING_REGISTRATION_COOKIE_NAME, token)
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite(jwtProperties.cookieSameSite)
            .path("/")
            .maxAge(KakaoPendingRegistrationTokenProvider.EXPIRATION)
            .build()
    }

    private fun clearPendingRegistrationCookie(): ResponseCookie {
        return ResponseCookie.from(PENDING_REGISTRATION_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite(jwtProperties.cookieSameSite)
            .path("/")
            .maxAge(Duration.ZERO)
            .build()
    }

    private fun createLinkCookie(token: String): ResponseCookie {
        return ResponseCookie.from(LINK_COOKIE_NAME, token)
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite(jwtProperties.cookieSameSite)
            .path("/")
            .maxAge(KakaoLinkTokenProvider.EXPIRATION)
            .build()
    }

    private fun clearLinkCookie(): ResponseCookie {
        return ResponseCookie.from(LINK_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite(jwtProperties.cookieSameSite)
            .path("/")
            .maxAge(Duration.ZERO)
            .build()
    }

    private fun createAuthCookie(name: String, value: String, maxAge: Duration): ResponseCookie {
        return ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(jwtProperties.refreshCookieSecure)
            .sameSite(jwtProperties.cookieSameSite)
            .path("/")
            .maxAge(maxAge)
            .build()
    }

    private fun frontendUri(path: String): URI = URI.create(kakaoProperties.frontendUrl.trimEnd('/') + path)

    companion object {
        private const val STATE_COOKIE_NAME = "kakao_oauth_state"
        private const val PENDING_REGISTRATION_COOKIE_NAME = "kakao_pending_registration"
        private const val LINK_COOKIE_NAME = "kakao_link_target"
        private val STATE_EXPIRATION: Duration = Duration.ofMinutes(10)
    }
}
