package com.yonghoo.team_manager.user.auth

import at.favre.lib.crypto.bcrypt.BCrypt
import org.springframework.stereotype.Component

@Component
class PasswordHasher {
    fun hash(password: String): String {
        return BCrypt.with(BCrypt.Version.VERSION_2B).hashToString(COST, password.toCharArray())
    }

    fun matches(password: String, passwordHash: String): Boolean {
        return BCrypt.verifyer().verify(password.toCharArray(), passwordHash).verified
    }

    companion object {
        private const val COST = 12
    }
}
