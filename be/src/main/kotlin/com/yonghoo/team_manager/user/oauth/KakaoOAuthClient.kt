package com.yonghoo.team_manager.user.oauth

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import org.springframework.http.MediaType
import org.springframework.stereotype.Component
import org.springframework.util.LinkedMultiValueMap
import org.springframework.web.client.RestClient
import org.springframework.web.util.UriComponentsBuilder

interface KakaoOAuthClient {
    fun createAuthorizationUrl(state: String): String
    fun getUser(code: String): KakaoUser
}

data class KakaoUser(
    val providerUserId: String,
    val nickname: String?,
    val email: String?,
    val birthYear: String?,
)

@Component
class KakaoOAuthRestClient(
    private val properties: KakaoOAuthProperties,
    restClientBuilder: RestClient.Builder,
) : KakaoOAuthClient {
    private val restClient = restClientBuilder.build()

    override fun createAuthorizationUrl(state: String): String {
        checkConfigured()
        return UriComponentsBuilder.fromUriString(AUTHORIZATION_URI)
            .queryParam("client_id", properties.clientId)
            .queryParam("redirect_uri", properties.redirectUri)
            .queryParam("response_type", "code")
            .queryParam("state", state)
            .build()
            .encode()
            .toUriString()
    }

    override fun getUser(code: String): KakaoUser {
        checkConfigured()
        val token = exchangeToken(code)
        val response = restClient.get()
            .uri(USER_INFO_URI)
            .header("Authorization", "Bearer ${token.accessToken}")
            .retrieve()
            .body(KakaoUserInfoResponse::class.java)
            ?: error("Kakao user response was empty.")

        require(response.id > 0) { "Kakao user id was missing." }
        val account = response.kakaoAccount
        return KakaoUser(
            providerUserId = response.id.toString(),
            nickname = account?.profile?.nickname,
            email = account?.email?.takeIf { account.isEmailValid != false && account.isEmailVerified != false },
            birthYear = account?.birthYear,
        )
    }

    private fun exchangeToken(code: String): KakaoTokenResponse {
        val body = LinkedMultiValueMap<String, String>().apply {
            add("grant_type", "authorization_code")
            add("client_id", properties.clientId)
            add("redirect_uri", properties.redirectUri)
            add("code", code)
            if (properties.clientSecret.isNotBlank()) {
                add("client_secret", properties.clientSecret)
            }
        }

        val response = restClient.post()
            .uri(TOKEN_URI)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(body)
            .retrieve()
            .body(KakaoTokenResponse::class.java)
            ?: error("Kakao token response was empty.")
        require(response.accessToken.isNotBlank()) { "Kakao access token was missing." }
        return response
    }

    private fun checkConfigured() {
        check(properties.clientId.isNotBlank()) { "KAKAO_CLIENT_ID is not configured." }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class KakaoTokenResponse(
        @JsonProperty("access_token") val accessToken: String = "",
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class KakaoUserInfoResponse(
        val id: Long = 0,
        @JsonProperty("kakao_account") val kakaoAccount: KakaoAccount? = null,
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class KakaoAccount(
        val profile: KakaoProfile? = null,
        val email: String? = null,
        @JsonProperty("is_email_valid") val isEmailValid: Boolean? = null,
        @JsonProperty("is_email_verified") val isEmailVerified: Boolean? = null,
        @JsonProperty("birthyear") val birthYear: String? = null,
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    private data class KakaoProfile(
        val nickname: String? = null,
    )

    companion object {
        private const val AUTHORIZATION_URI = "https://kauth.kakao.com/oauth/authorize"
        private const val TOKEN_URI = "https://kauth.kakao.com/oauth/token"
        private const val USER_INFO_URI = "https://kapi.kakao.com/v2/user/me"
    }
}
