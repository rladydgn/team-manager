package com.yonghoo.team_manager.inquiry.dto

import com.yonghoo.team_manager.inquiry.domain.InquiryCategory

data class InquiryCreateRequest(
    val category: InquiryCategory,
    val title: String,
    val content: String,
)
