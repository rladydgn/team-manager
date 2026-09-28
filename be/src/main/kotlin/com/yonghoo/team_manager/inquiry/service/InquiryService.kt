package com.yonghoo.team_manager.inquiry.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.inquiry.dto.InquiryCreateRequest
import com.yonghoo.team_manager.inquiry.dto.InquiryListResponse
import com.yonghoo.team_manager.inquiry.dto.InquiryResponse
import com.yonghoo.team_manager.inquiry.dto.InquirySummaryResponse
import com.yonghoo.team_manager.inquiry.exception.InquiryErrorCode
import com.yonghoo.team_manager.inquiry.repository.InquiryRepository
import com.yonghoo.team_manager.user.domain.UserStatus
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class InquiryService(
    private val inquiryRepository: InquiryRepository,
    private val userRepository: UserRepository,
) {
    fun create(userId: Long, request: InquiryCreateRequest): InquiryResponse {
        requireActiveUser(userId)
        val title = request.title.trim()
        val content = request.content.trim()
        if (title.isBlank() || request.title.length > 100 || content.isBlank() || request.content.length > 10_000) {
            throw ApiException(InquiryErrorCode.INVALID_INQUIRY_REQUEST)
        }
        return InquiryResponse.from(inquiryRepository.create(userId, request.category, title, content))
    }

    @Transactional(readOnly = true)
    fun getMine(userId: Long, inquiryId: Long): InquiryResponse {
        requireActiveUser(userId)
        val inquiry = inquiryRepository.selectByIdAndUserId(inquiryId, userId)
            ?: throw ApiException(InquiryErrorCode.INQUIRY_NOT_FOUND)
        return InquiryResponse.from(inquiry)
    }

    @Transactional(readOnly = true)
    fun listMine(userId: Long, page: Int): InquiryListResponse {
        requireActiveUser(userId)
        if (page < 0) throw ApiException(InquiryErrorCode.INVALID_INQUIRY_PAGE)
        val records = inquiryRepository.selectByUserId(userId, page.toLong() * PAGE_SIZE, PAGE_SIZE + 1)
        return InquiryListResponse(
            inquiries = records.take(PAGE_SIZE).map(InquirySummaryResponse::from),
            page = page,
            pageSize = PAGE_SIZE,
            hasNext = records.size > PAGE_SIZE,
        )
    }

    private fun requireActiveUser(userId: Long) {
        val user = userRepository.selectUserById(userId)
        if (user == null || user.status != UserStatus.ACTIVE || user.deletedAt != null) {
            throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
        }
    }

    companion object { private const val PAGE_SIZE = 20 }
}
