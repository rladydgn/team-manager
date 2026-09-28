package com.yonghoo.team_manager.common.filter

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import jakarta.servlet.FilterChain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertSame
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse

class ApiLoggingFilterTest {
    private val filter = ApiLoggingFilter()
    private val logger = LoggerFactory.getLogger(ApiLoggingFilter::class.java) as Logger
    private val appender = ListAppender<ILoggingEvent>()
    private var originalLevel: Level? = null

    @BeforeEach
    fun setUp() {
        originalLevel = logger.level
        logger.level = Level.INFO
        appender.start()
        logger.addAppender(appender)
    }

    @AfterEach
    fun tearDown() {
        logger.detachAppender(appender)
        logger.level = originalLevel
        appender.stop()
        MDC.remove("requestId")
    }

    @Test
    fun `요청 ID와 처리 결과를 기록하고 민감한 데이터는 기록하지 않는다`() {
        val request = MockHttpServletRequest("POST", "/users/sign-in").apply {
            queryString = "code=secret-code"
            addHeader("Authorization", "Bearer secret-token")
            addHeader("Cookie", "accessToken=secret-cookie")
            setContent("{\"password\":\"secret-password\"}".toByteArray())
        }
        val response = MockHttpServletResponse()

        filter.doFilter(request, response, FilterChain { _, _ ->
            assertNotNull(MDC.get("requestId"))
            assertEquals(response.getHeader("X-Request-ID"), MDC.get("requestId"))
            response.status = 201
            response.writer.write("secret-response")
        })

        val event = appender.list.single()
        assertEquals(Level.INFO, event.level)
        assertTrue(event.formattedMessage.contains("method=POST, path=/users/sign-in, status=201, durationMs="))
        assertFalse(event.formattedMessage.contains("secret"))
        assertEquals("secret-response", response.contentAsString)
        assertNull(MDC.get("requestId"))
    }

    @Test
    fun `인증 거부도 기록하고 기존 MDC를 복원한다`() {
        MDC.put("requestId", "parent-request")
        val response = MockHttpServletResponse()

        filter.doFilter(MockHttpServletRequest("GET", "/teams/1"), response, FilterChain { _, _ ->
            response.status = 401
        })

        val event = appender.list.single()
        assertEquals(Level.WARN, event.level)
        assertTrue(event.formattedMessage.contains("status=401"))
        assertEquals("parent-request", MDC.get("requestId"))
    }

    @Test
    fun `처리되지 않은 예외는 500으로 기록하고 그대로 전파한다`() {
        val exception = IllegalStateException("secret-exception")

        val thrown = assertThrows(IllegalStateException::class.java) {
            filter.doFilter(
                MockHttpServletRequest("PUT", "/teams/1"),
                MockHttpServletResponse(),
                FilterChain { _, _ -> throw exception },
            )
        }

        assertSame(exception, thrown)
        val event = appender.list.single()
        assertEquals(Level.ERROR, event.level)
        assertTrue(event.formattedMessage.contains("status=500"))
        assertFalse(event.formattedMessage.contains("secret"))
        assertNull(MDC.get("requestId"))
    }
}
