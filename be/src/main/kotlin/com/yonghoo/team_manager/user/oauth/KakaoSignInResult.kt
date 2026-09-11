package com.yonghoo.team_manager.user.oauth

import com.yonghoo.team_manager.user.dto.UserSignInResult

sealed interface KakaoSignInResult {
    data class SignedIn(val result: UserSignInResult) : KakaoSignInResult
    data class RegistrationRequired(val pendingRegistrationToken: String) : KakaoSignInResult
}
