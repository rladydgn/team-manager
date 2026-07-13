package com.yonghoo.team_manager.user.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.user.domain.UserRecord
import com.yonghoo.team_manager.user.dto.UserLoginRequest
import com.yonghoo.team_manager.user.dto.UserLoginResponse
import com.yonghoo.team_manager.user.dto.UserRegisterRequest
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.repository.UserRepository
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Transactional
@Service
class UserService(
    private val passwordEncoder: PasswordEncoder,
    private val userRepository: UserRepository,
) {
    fun registerUser(request: UserRegisterRequest) {
        validateRegisterRequest(request)

        if (userRepository.existsByUsername(request.username)) {
            throw ApiException(UserErrorCode.DUPLICATED_USERNAME)
        }

        val passwordHash = passwordEncoder.encode(request.password)
            ?: throw ApiException(UserErrorCode.INVALID_REGISTER_REQUEST)

        userRepository.createUser(
            request = request,
            passwordHash = passwordHash,
        )
    }

    fun signIn(request: UserLoginRequest): UserLoginResponse {
        val user = userRepository.selectUserByUsername(request.username)
            ?: throw ApiException(UserErrorCode.LOGIN_FAILED)

        if (!passwordEncoder.matches(request.password, user.passwordHash)) {
            throw ApiException(UserErrorCode.LOGIN_FAILED)
        }

        val loggedInUser = userRepository.updateLastLoginAt(user.id, LocalDateTime.now())
        return UserLoginResponse.from(loggedInUser)
    }

    fun getUser(username: String): UserRecord? {
        return userRepository.selectUserByUsername(username)
    }

    fun isValidUsername(username: String): Boolean {
        return USERNAME_REGEX.matches(username) && !userRepository.existsByUsername(username)
    }

    private fun validateRegisterRequest(request: UserRegisterRequest) {
        if (!USERNAME_REGEX.matches(request.username) ||
            !PASSWORD_REGEX.matches(request.password)
        ) {
            throw ApiException(UserErrorCode.INVALID_REGISTER_REQUEST)
        }
    }

    companion object {
        private val USERNAME_REGEX = Regex("^[a-z0-9_-]{5,20}$")
        private val PASSWORD_REGEX = Regex("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#\$%^&*()_+\\-={}\\[\\]:\";'<>?,./]).{8,20}$")
    }
}
