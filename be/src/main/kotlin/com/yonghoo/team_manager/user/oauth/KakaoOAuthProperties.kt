package com.yonghoo.team_manager.user.oauth

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.kakao")
data class KakaoOAuthProperties(
    val clientId: String = "",
    val clientSecret: String = "",
    val redirectUri: String = "http://localhost:3000/api/oauth/kakao/callback",
    val frontendUrl: String = "http://localhost:3000",
)
