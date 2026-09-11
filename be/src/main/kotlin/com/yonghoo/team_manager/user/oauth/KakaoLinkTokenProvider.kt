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
class KakaoLinkTokenProvider(
    properties: JwtProperties,
) {
    private val issuer = "${properties.issuer}-kakao-link"
    private val signingKey: SecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secret))

    fun createToken(userId: Long): String {
        val now = Instant.now()
        return Jwts.builder()
            .issuer(issuer)
            .subject(userId.toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(EXPIRATION)))
            .signWith(signingKey)
            .compact()
    }

    fun parseUserId(token: String): Long {
        return Jwts.parser()
            .verifyWith(signingKey)
            .requireIssuer(issuer)
            .build()
            .parseSignedClaims(token)
            .payload
            .subject
            .toLong()
    }

    companion object {
        val EXPIRATION: Duration = Duration.ofMinutes(10)
    }
}
