package com.yonghoo.team_manager.user.auth

import com.fasterxml.jackson.databind.ObjectMapper
import com.yonghoo.team_manager.exception.dto.ErrorResponse
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.jsonwebtoken.JwtException
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.web.servlet.HandlerInterceptor

const val AUTHENTICATED_USER_ID_ATTRIBUTE = "authenticatedUserId"

@Component
class JwtAuthenticationInterceptor(
    private val jwtTokenProvider: JwtTokenProvider,
    private val objectMapper: ObjectMapper,
) : HandlerInterceptor {
    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
    ): Boolean {
        if (isPublicRequest(request)) {
            return true
        }

        val accessToken = resolveAccessToken(request)
            ?: return writeUnauthorizedResponse(response)

        val userId = try {
            jwtTokenProvider.getAccessTokenUserId(accessToken)
        } catch (_: JwtException) {
            return writeUnauthorizedResponse(response)
        } catch (_: IllegalArgumentException) {
            return writeUnauthorizedResponse(response)
        }

        request.setAttribute(AUTHENTICATED_USER_ID_ATTRIBUTE, userId)
        return true
    }

    private fun isPublicRequest(request: HttpServletRequest): Boolean {
        val path = request.requestURI

        return path in PUBLIC_PATHS ||
            path.startsWith("/swagger-ui/") ||
            path.startsWith("/v3/api-docs/") ||
            (request.method == "GET" && (
                path == "/teams" ||
                    path.startsWith("/teams/") ||
                    path.startsWith("/matches/")
                ))
    }

    private fun resolveAccessToken(request: HttpServletRequest): String? {
        val authorization = request.getHeader(HttpHeaders.AUTHORIZATION) ?: return null

        return authorization
            .takeIf { it.startsWith(BEARER_PREFIX) }
            ?.removePrefix(BEARER_PREFIX)
            ?.takeIf(String::isNotBlank)
    }

    private fun writeUnauthorizedResponse(response: HttpServletResponse): Boolean {
        val errorCode = UserErrorCode.UNAUTHORIZED_ACCESS
        response.status = errorCode.status.value()
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        objectMapper.writeValue(
            response.outputStream,
            ErrorResponse(errorCode.status.value(), errorCode.code, errorCode.message),
        )
        return false
    }

    companion object {
        private const val BEARER_PREFIX = "Bearer "
        private val PUBLIC_PATHS = setOf(
            "/users/sign-in",
            "/users/sign-up",
            "/users/id/check",
            "/users/token/refresh",
        )
    }
}
