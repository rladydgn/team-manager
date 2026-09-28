package com.yonghoo.team_manager.common.filter

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID
import java.util.concurrent.TimeUnit

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class ApiLoggingFilter : OncePerRequestFilter() {
    private val log = LoggerFactory.getLogger(ApiLoggingFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val requestId = UUID.randomUUID().toString()
        val previousRequestId = MDC.get(REQUEST_ID_KEY)
        val startedAt = System.nanoTime()
        var failed = false

        MDC.put(REQUEST_ID_KEY, requestId)
        response.setHeader("X-Request-ID", requestId)
        try {
            filterChain.doFilter(request, response)
        } catch (exception: Exception) {
            failed = true
            throw exception
        } finally {
            try {
                val status = if (failed) HttpServletResponse.SC_INTERNAL_SERVER_ERROR else response.status
                val durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt)
                // Query strings, headers, cookies, and bodies can contain credentials or personal data.
                val path = request.requestURI.substringBefore('?').take(2048)
                    .replace(Regex("[\\p{Cntrl}]"), "_")
                val message = "API request: method={}, path={}, status={}, durationMs={}"
                when {
                    status >= 500 -> log.error(message, request.method, path, status, durationMs)
                    status >= 400 -> log.warn(message, request.method, path, status, durationMs)
                    else -> log.info(message, request.method, path, status, durationMs)
                }
            } finally {
                if (previousRequestId == null) {
                    MDC.remove(REQUEST_ID_KEY)
                } else {
                    MDC.put(REQUEST_ID_KEY, previousRequestId)
                }
            }
        }
    }

    companion object {
        private const val REQUEST_ID_KEY = "requestId"
    }
}
