package com.yonghoo.team_manager.user.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.user.auth.JwtTokenProvider
import com.yonghoo.team_manager.user.auth.PasswordHasher
import com.yonghoo.team_manager.user.dto.UserRegisterRequest
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.repository.UserRepository
import com.yonghoo.team_manager.user.repository.UserSocialAccountRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.*
import java.time.LocalDate

class UserEmailValidationTest {
    private val users = mock(UserRepository::class.java)
    private val hasher = mock(PasswordHasher::class.java)
    private val service = UserService(hasher, users, mock(JwtTokenProvider::class.java), mock(UserSocialAccountRepository::class.java))

    @Test
    fun `잘못된 이메일은 중복 확인과 회원가입에서 DB 접근 전에 거절한다`() {
        val invalidEmails = listOf("", "team", "team@example", "team@@example.com", "team @example.com",
            ".team@example.com", "team..name@example.com", "team@-example.com", "team@example..com", "${"a".repeat(65)}@example.com")
        for (email in invalidEmails) {
            assertFalse(service.isValidEmail(email), email)
            assertEquals(UserErrorCode.INVALID_EMAIL, assertThrows<ApiException> {
                service.registerUser(UserRegisterRequest("홍길동", LocalDate.of(1998, 1, 1), "user_01", "Example1!", email))
            }.errorCode)
        }
        verifyNoInteractions(users, hasher)
    }

    @Test
    fun `정상 형식은 허용하며 중복 이메일은 계속 차단한다`() {
        for (email in listOf("team@example.com", " player+team@sub.example.co.kr ", "first.last@example.com")) {
            assertTrue(service.isValidEmail(email))
        }
        `when`(users.existsByEmail("team@example.com")).thenReturn(true)
        assertFalse(service.isValidEmail("team@example.com"))
    }
}
