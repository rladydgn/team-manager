package com.yonghoo.team_manager.user.oauth

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.user.auth.JwtTokenProvider
import com.yonghoo.team_manager.user.domain.SocialProvider
import com.yonghoo.team_manager.user.domain.UserRecord
import com.yonghoo.team_manager.user.dto.UserLoginResponse
import com.yonghoo.team_manager.user.dto.UserSignInResult
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.repository.UserRepository
import com.yonghoo.team_manager.user.repository.UserSocialAccountRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.Year

@Service
class KakaoOAuthService(
    private val kakaoOAuthClient: KakaoOAuthClient,
    private val userRepository: UserRepository,
    private val socialAccountRepository: UserSocialAccountRepository,
    private val jwtTokenProvider: JwtTokenProvider,
    private val pendingRegistrationTokenProvider: KakaoPendingRegistrationTokenProvider,
) {
    fun createAuthorizationUrl(state: String): String = kakaoOAuthClient.createAuthorizationUrl(state)

    @Transactional
    fun signIn(code: String): KakaoSignInResult {
        val kakaoUser = getKakaoUser(code)

        val linkedUserId = socialAccountRepository.selectUserId(
            SocialProvider.KAKAO,
            kakaoUser.providerUserId,
        )
        if (linkedUserId == null) {
            return KakaoSignInResult.RegistrationRequired(
                pendingRegistrationTokenProvider.createToken(kakaoUser),
            )
        }

        val user = userRepository.selectUserById(linkedUserId)
            ?: throw ApiException(UserErrorCode.KAKAO_LOGIN_FAILED)
        return KakaoSignInResult.SignedIn(createSignInResult(user))
    }

    @Transactional
    fun linkAccount(code: String, userId: Long) {
        if (!userRepository.existsById(userId)) {
            throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
        }

        val kakaoUser = getKakaoUser(code)
        val linkedUserId = socialAccountRepository.selectUserId(
            SocialProvider.KAKAO,
            kakaoUser.providerUserId,
        )
        if (linkedUserId == userId) {
            return
        }
        if (linkedUserId != null) {
            throw ApiException(UserErrorCode.KAKAO_ACCOUNT_ALREADY_LINKED)
        }

        socialAccountRepository.create(
            userId = userId,
            provider = SocialProvider.KAKAO,
            providerUserId = kakaoUser.providerUserId,
            providerEmail = kakaoUser.email,
        )
    }

    @Transactional
    fun completeSignUp(username: String, pendingRegistrationToken: String): UserSignInResult {
        if (!USERNAME_REGEX.matches(username)) {
            throw ApiException(UserErrorCode.INVALID_REGISTER_REQUEST)
        }
        if (userRepository.existsByUsername(username)) {
            throw ApiException(UserErrorCode.DUPLICATED_USERNAME)
        }

        val kakaoUser = try {
            pendingRegistrationTokenProvider.parseToken(pendingRegistrationToken)
        } catch (exception: RuntimeException) {
            throw ApiException(UserErrorCode.KAKAO_LOGIN_FAILED, cause = exception)
        }
        if (socialAccountRepository.selectUserId(SocialProvider.KAKAO, kakaoUser.providerUserId) != null) {
            throw ApiException(UserErrorCode.KAKAO_LOGIN_FAILED)
        }

        val email = kakaoUser.email
            ?.trim()
            ?.takeIf(String::isNotBlank)
            ?.takeUnless(userRepository::existsByEmail)
        val user = userRepository.createSocialUser(
            username = username,
            name = kakaoUser.nickname?.trim()?.takeIf(String::isNotBlank)?.take(NAME_MAX_LENGTH)
                ?: DEFAULT_NAME,
            birthDate = parseBirthYear(kakaoUser.birthYear),
            email = email,
        )
        socialAccountRepository.create(
            userId = user.id,
            provider = SocialProvider.KAKAO,
            providerUserId = kakaoUser.providerUserId,
            providerEmail = kakaoUser.email,
        )
        return createSignInResult(user)
    }

    private fun createSignInResult(user: UserRecord): UserSignInResult {
        val loggedInUser = userRepository.updateLastLoginAt(user.id, LocalDateTime.now())
        return UserSignInResult(
            response = UserLoginResponse.from(loggedInUser),
            accessToken = jwtTokenProvider.createAccessToken(loggedInUser),
            refreshToken = jwtTokenProvider.createRefreshToken(loggedInUser),
        )
    }

    private fun getKakaoUser(code: String): KakaoUser {
        return try {
            kakaoOAuthClient.getUser(code)
        } catch (exception: Exception) {
            throw ApiException(UserErrorCode.KAKAO_LOGIN_FAILED, cause = exception)
        }
    }

    private fun parseBirthYear(value: String?): LocalDate? {
        val year = value?.toIntOrNull() ?: return null
        return if (year in MIN_BIRTH_YEAR..Year.now().value) LocalDate.of(year, 1, 1) else null
    }

    companion object {
        private const val DEFAULT_NAME = "카카오 사용자"
        private const val NAME_MAX_LENGTH = 50
        private const val MIN_BIRTH_YEAR = 1900
        private val USERNAME_REGEX = Regex("^[a-z0-9_-]{5,20}$")
    }
}
