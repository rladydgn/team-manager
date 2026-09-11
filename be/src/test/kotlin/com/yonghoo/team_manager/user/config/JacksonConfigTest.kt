package com.yonghoo.team_manager.user.config

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.LocalDate

class JacksonConfigTest {
    @Test
    fun `LocalDate를 ISO 문자열로 직렬화한다`() {
        val objectMapper = JacksonConfig().objectMapper()

        val result = objectMapper.writeValueAsString(
            mapOf("foundedAt" to LocalDate.of(2025, 3, 1)),
        )

        assertEquals("{\"foundedAt\":\"2025-03-01\"}", result)
    }
}
