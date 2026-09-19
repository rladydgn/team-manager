package com.yonghoo.team_manager.match.dto

import com.fasterxml.jackson.annotation.JsonInclude

data class MatchNotesResponse(
    val publicNote: String,
    @get:JsonInclude(JsonInclude.Include.NON_NULL)
    val managerNote: String?,
    val canManage: Boolean,
)
