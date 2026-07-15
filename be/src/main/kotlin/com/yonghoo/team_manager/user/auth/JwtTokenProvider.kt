package com.yonghoo.team_manager.user.auth

import com.yonghoo.team_manager.user.domain.UserRecord
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    private val properties: JwtProperties,
) {
    private val signingKey: SecretKey = createSigningKey(properties.secret)

    fun createAccessToken(user: UserRecord): String {
        return createToken(user, TokenType.ACCESS, properties.accessTokenExpiration)
    }

    fun createRefreshToken(user: UserRecord): String {
        return createToken(user, TokenType.REFRESH, properties.refreshTokenExpiration)
    }

    fun getAccessTokenUserId(accessToken: String): Long {
        return getUserId(accessToken, TokenType.ACCESS)
    }

    fun getRefreshTokenUserId(refreshToken: String): Long {
        return getUserId(refreshToken, TokenType.REFRESH)
    }

    private fun createToken(
        user: UserRecord,
        tokenType: TokenType,
        expiration: java.time.Duration,
    ): String {
        val issuedAt = Instant.now()
        val expiresAt = issuedAt.plus(expiration)

        return Jwts.builder()
            .issuer(properties.issuer)
            .subject(user.id.toString())
            .claim("username", user.username)
            .claim(TOKEN_TYPE_CLAIM, tokenType.name)
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(expiresAt))
            .signWith(signingKey)
            .compact()
    }

    private fun getUserId(
        token: String,
        tokenType: TokenType,
    ): Long {
        val claims = Jwts.parser()
            .verifyWith(signingKey)
            .requireIssuer(properties.issuer)
            .build()
            .parseSignedClaims(token)
            .payload

        require(claims[TOKEN_TYPE_CLAIM] == tokenType.name) { "Invalid token type." }
        return claims.subject.toLong()
    }

    private fun createSigningKey(secret: String): SecretKey {
        val keyBytes = try {
            Decoders.BASE64.decode(secret)
        } catch (exception: IllegalArgumentException) {
            throw IllegalStateException("JWT_SECRET must be a Base64-encoded secret.", exception)
        }

        return try {
            Keys.hmacShaKeyFor(keyBytes)
        } catch (exception: IllegalArgumentException) {
            throw IllegalStateException("JWT_SECRET must contain at least 256 bits.", exception)
        }
    }

    private enum class TokenType {
        ACCESS,
        REFRESH,
    }

    companion object {
        private const val TOKEN_TYPE_CLAIM = "tokenType"
    }
}
