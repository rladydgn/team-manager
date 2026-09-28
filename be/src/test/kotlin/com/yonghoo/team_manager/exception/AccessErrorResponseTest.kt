package com.yonghoo.team_manager.exception

import com.yonghoo.team_manager.exception.dto.CommonErrorCode
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.user.exception.UserErrorCode
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockHttpServletRequest

class AccessErrorResponseTest {
    private val handler = GlobalExceptionHandler()
    private val request = MockHttpServletRequest("GET", "/teams/1/members")

    @Test
    fun `권한 거절과 존재하지 않는 리소스는 동일한 404 응답이다`() {
        val forbidden = handler.handleApiException(ApiException(TeamErrorCode.TEAM_MEMBER_VIEW_FORBIDDEN), request)
        val missing = handler.handleApiException(ApiException(TeamErrorCode.TEAM_NOT_FOUND), request)
        assertEquals(404, forbidden.statusCode.value())
        assertEquals(missing.body, forbidden.body)
        assertEquals(CommonErrorCode.RESOURCE_NOT_FOUND.code, forbidden.body?.code)
    }

    @Test
    fun `쿠키 갱신을 위한 인증 오류는 401을 유지한다`() {
        val result = handler.handleApiException(ApiException(UserErrorCode.UNAUTHORIZED_ACCESS), request)
        assertEquals(401, result.statusCode.value())
    }

    @Test
    fun `서버 오류는 권한 부족 404로 숨기지 않는다`() {
        val result = handler.handleUnexpectedException(IllegalStateException("test"), request)
        assertEquals(500, result.statusCode.value())
    }
}
