package com.yonghoo.team_manager.exception.exception

import com.yonghoo.team_manager.exception.dto.ErrorCode

open class ApiException(
    val errorCode: ErrorCode,
    override val message: String = errorCode.message,
    cause: Throwable? = null,
) : RuntimeException(message, cause)
