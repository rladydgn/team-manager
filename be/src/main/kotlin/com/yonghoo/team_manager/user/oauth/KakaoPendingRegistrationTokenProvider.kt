package com.yonghoo.team_manager.user.oauth

import com.yonghoo.team_manager.user.auth.JwtProperties
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.time.Duration
import java.time.Instant
import java.util.Date
import javax.crypto.SecretKey

@Component
class KakaoPendingRegistrationTokenProvider(
    properties: JwtProperties,
) {
    private val issuer = "${properties.issuer}-kakao-registration"
    private val signingKey: SecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secret))

    fun createToken(user: KakaoUser): String {
        val now = Instant.now()
        val builder = Jwts.builder()
            .issuer(issuer)
            .subject(user.providerUserId)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(EXPIRATION)))

        user.nickname?.let { builder.claim(NICKNAME_CLAIM, it) }
        user.email?.let { builder.claim(EMAIL_CLAIM, it) }
        user.birthYear?.let { builder.claim(BIRTH_YEAR_CLAIM, it) }
        return builder.signWith(signingKey).compact()
    }

    fun parseToken(token: String): KakaoUser {
        val claims = Jwts.parser()
            .verifyWith(signingKey)
            .requireIssuer(issuer)
            .build()
            .parseSignedClaims(token)
            .payload

        return KakaoUser(
            providerUserId = claims.subject,
            nickname = claims[NICKNAME_CLAIM] as? String,
            email = claims[EMAIL_CLAIM] as? String,
            birthYear = claims[BIRTH_YEAR_CLAIM] as? String,
        )
    }

    companion object {
        val EXPIRATION: Duration = Duration.ofMinutes(10)
        private const val NICKNAME_CLAIM = "nickname"
        private const val EMAIL_CLAIM = "email"
        private const val BIRTH_YEAR_CLAIM = "birthYear"
    }
}
