package com.yonghoo.team_manager.user.auth

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties(prefix = "app.jwt")
data class JwtProperties(
    val secret: String,
    val issuer: String,
    val accessTokenExpiration: Duration,
    val refreshTokenExpiration: Duration,
    val refreshCookieSecure: Boolean,
)
