package com.yonghoo.team_manager.user.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.user.auth.JwtTokenProvider
import com.yonghoo.team_manager.user.auth.PasswordHasher
import com.yonghoo.team_manager.user.domain.UserRecord
import com.yonghoo.team_manager.user.dto.UserLoginRequest
import com.yonghoo.team_manager.user.dto.UserLoginResponse
import com.yonghoo.team_manager.user.dto.UserAccessTokenResult
import com.yonghoo.team_manager.user.dto.UserRegisterRequest
import com.yonghoo.team_manager.user.dto.UserSignInResult
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime
import java.time.Year

@Transactional
@Service
class UserService(
    private val passwordHasher: PasswordHasher,
    private val userRepository: UserRepository,
    private val jwtTokenProvider: JwtTokenProvider,
) {
    fun registerUser(request: UserRegisterRequest) {
        validateRegisterRequest(request)

        if (userRepository.existsByUsername(request.username)) {
            throw ApiException(UserErrorCode.DUPLICATED_USERNAME)
        }

        if (userRepository.existsByEmail(request.email)) {
            throw ApiException(UserErrorCode.DUPLICATED_EMAIL)
        }

        val passwordHash = passwordHasher.hash(request.password)

        userRepository.createUser(
            request = request,
            passwordHash = passwordHash,
        )
    }

    fun signIn(request: UserLoginRequest): UserSignInResult {
        val user = userRepository.selectUserByUsername(request.username)
            ?: throw ApiException(UserErrorCode.LOGIN_FAILED)

        if (!passwordHasher.matches(request.password, user.passwordHash)) {
            throw ApiException(UserErrorCode.LOGIN_FAILED)
        }

        val loggedInUser = userRepository.updateLastLoginAt(user.id, LocalDateTime.now())
        return UserSignInResult(
            response = createLoginResponse(loggedInUser),
            accessToken = jwtTokenProvider.createAccessToken(loggedInUser),
            refreshToken = jwtTokenProvider.createRefreshToken(loggedInUser),
        )
    }

    fun refreshAccessToken(refreshToken: String): UserAccessTokenResult {
        val userId = try {
            jwtTokenProvider.getRefreshTokenUserId(refreshToken)
        } catch (exception: RuntimeException) {
            throw ApiException(UserErrorCode.INVALID_REFRESH_TOKEN)
        }
        val user = userRepository.selectUserById(userId)
            ?: throw ApiException(UserErrorCode.INVALID_REFRESH_TOKEN)

        return UserAccessTokenResult(
            response = createLoginResponse(user),
            accessToken = jwtTokenProvider.createAccessToken(user),
        )
    }

    @Transactional(readOnly = true)
    fun getCurrentUser(userId: Long): UserLoginResponse {
        val user = userRepository.selectUserById(userId)
            ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)

        return createLoginResponse(user)
    }

    fun getUser(username: String): UserRecord? {
        return userRepository.selectUserByUsername(username)
    }

    fun isValidUsername(username: String): Boolean {
        return USERNAME_REGEX.matches(username) && !userRepository.existsByUsername(username)
    }

    fun isValidEmail(email: String): Boolean {
        return email.isNotBlank() && !userRepository.existsByEmail(email)
    }

    private fun validateRegisterRequest(request: UserRegisterRequest) {
        val name = request.name.trim()

        if (!USERNAME_REGEX.matches(request.username) ||
            !PASSWORD_REGEX.matches(request.password) ||
            name.isBlank() || name.length > NAME_MAX_LENGTH ||
            request.birthDate.year !in MIN_BIRTH_YEAR..Year.now().value ||
            request.birthDate.monthValue != JANUARY ||
            request.birthDate.dayOfMonth != FIRST_DAY_OF_MONTH ||
            request.email.isBlank()
        ) {
            throw ApiException(UserErrorCode.INVALID_REGISTER_REQUEST)
        }
    }

    private fun createLoginResponse(user: UserRecord): UserLoginResponse {
        return UserLoginResponse.from(user)
    }

    companion object {
        private const val NAME_MAX_LENGTH = 50
        private const val MIN_BIRTH_YEAR = 1900
        private const val JANUARY = 1
        private const val FIRST_DAY_OF_MONTH = 1
        private val USERNAME_REGEX = Regex("^[a-z0-9_-]{5,20}$")
        private val PASSWORD_REGEX = Regex("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#\$%^&*()_+\\-={}\\[\\]:\";'<>?,./]).{8,20}$")
    }
}
