package com.yonghoo.team_manager.inquiry

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.inquiry.domain.InquiryCategory
import com.yonghoo.team_manager.inquiry.domain.InquiryRecord
import com.yonghoo.team_manager.inquiry.domain.InquiryStatus
import com.yonghoo.team_manager.inquiry.dto.InquiryCreateRequest
import com.yonghoo.team_manager.inquiry.exception.InquiryErrorCode
import com.yonghoo.team_manager.inquiry.repository.InquiryRepository
import com.yonghoo.team_manager.inquiry.service.InquiryService
import com.yonghoo.team_manager.user.domain.UserRecord
import com.yonghoo.team_manager.user.domain.UserStatus
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.mockito.Mockito.*
import java.time.LocalDateTime

class InquiryServiceTest {
    private val inquiries = mock(InquiryRepository::class.java)
    private val users = mock(UserRepository::class.java)
    private val service = InquiryService(inquiries, users)
    private val now = LocalDateTime.of(2026, 9, 24, 12, 0)
    private val user = UserRecord(7, "member", null, "사용자", null, null, UserStatus.ACTIVE, null, now, now, null)
    private val record = InquiryRecord(11, 7, InquiryCategory.USAGE, "이용 방법", "문의 내용", InquiryStatus.WAITING, now)

    @BeforeEach
    fun setup() {
        `when`(users.selectUserById(7)).thenReturn(user)
    }

    @ParameterizedTest
    @EnumSource(InquiryCategory::class)
    fun `팀 역할 없이 모든 문의 카테고리로 작성한다`(category: InquiryCategory) {
        `when`(inquiries.create(7, category, "이용 방법", "문의 내용")).thenReturn(record.copy(category = category))
        val result = service.create(7, InquiryCreateRequest(category, "  이용 방법  ", "\n문의 내용\n"))
        assertEquals(InquiryStatus.WAITING, result.status)
        assertEquals(category, result.category)
        assertEquals("문의 내용", result.content)
        verify(inquiries).create(7, category, "이용 방법", "문의 내용")
    }

    @Test
    fun `작성자 ID를 포함한 조회로 본인 문의만 반환한다`() {
        `when`(inquiries.selectByIdAndUserId(11, 7)).thenReturn(record)
        assertEquals(record.content, service.getMine(7, 11).content)
        verify(inquiries).selectByIdAndUserId(11, 7)
    }

    @Test
    fun `다른 사용자의 문의는 존재하지 않는 문의와 동일하게 처리한다`() {
        `when`(users.selectUserById(8)).thenReturn(user.copy(id = 8))
        `when`(inquiries.selectByIdAndUserId(11, 8)).thenReturn(null)
        for (id in listOf(11L, 999L)) {
            assertEquals(InquiryErrorCode.INQUIRY_NOT_FOUND, assertThrows<ApiException> {
                service.getMine(8, id)
            }.errorCode)
            verify(inquiries).selectByIdAndUserId(id, 8)
        }
    }

    @Test
    fun `작성자의 목록을 20개씩 반환하고 다음 페이지 존재 여부를 계산한다`() {
        val records = (1L..21L).map { record.copy(id = it) }
        `when`(inquiries.selectByUserId(7, 0, 21)).thenReturn(records)
        `when`(inquiries.selectByUserId(7, 20, 21)).thenReturn(listOf(records.last()))
        val first = service.listMine(7, 0)
        assertEquals(20, first.inquiries.size)
        assertTrue(first.hasNext)
        val last = service.listMine(7, 1)
        assertEquals(1, last.inquiries.size)
        assertFalse(last.hasNext)
        verify(inquiries).selectByUserId(7, 0, 21)
        verify(inquiries).selectByUserId(7, 20, 21)
    }

    @Test
    fun `빈 목록과 정확히 20개의 목록은 다음 페이지가 없다`() {
        for (count in listOf(0, 20)) {
            `when`(inquiries.selectByUserId(7, 0, 21)).thenReturn(List(count) { record })
            val result = service.listMine(7, 0)
            assertEquals(count, result.inquiries.size)
            assertFalse(result.hasNext)
        }
    }

    @Test
    fun `음수 페이지를 거부한다`() {
        assertEquals(InquiryErrorCode.INVALID_INQUIRY_PAGE, assertThrows<ApiException> {
            service.listMine(7, -1)
        }.errorCode)
        verifyNoInteractions(inquiries)
    }

    @Test
    fun `공백 또는 길이 제한을 넘는 입력은 저장하지 않는다`() {
        val invalid = listOf(
            InquiryCreateRequest(InquiryCategory.OTHER, " \n ", "내용"),
            InquiryCreateRequest(InquiryCategory.OTHER, "제목", " \n "),
            InquiryCreateRequest(InquiryCategory.OTHER, "가".repeat(101), "내용"),
            InquiryCreateRequest(InquiryCategory.OTHER, "제목", "가".repeat(10_001)),
        )
        for (request in invalid) {
            assertEquals(InquiryErrorCode.INVALID_INQUIRY_REQUEST, assertThrows<ApiException> {
                service.create(7, request)
            }.errorCode)
        }
        verifyNoInteractions(inquiries)
    }

    @Test
    fun `제목과 내용의 최대 길이를 허용한다`() {
        val title = "가".repeat(100)
        val content = "나".repeat(10_000)
        `when`(inquiries.create(7, InquiryCategory.OTHER, title, content))
            .thenReturn(record.copy(title = title, content = content, category = InquiryCategory.OTHER))
        assertEquals(content, service.create(7, InquiryCreateRequest(InquiryCategory.OTHER, title, content)).content)
    }

    @Test
    fun `삭제 비활성 차단 또는 없는 계정은 문의 API를 이용할 수 없다`() {
        for (invalidUser in listOf(null, user.copy(deletedAt = now), user.copy(status = UserStatus.INACTIVE), user.copy(status = UserStatus.BANNED))) {
            `when`(users.selectUserById(7)).thenReturn(invalidUser)
            assertEquals(UserErrorCode.UNAUTHORIZED_ACCESS, assertThrows<ApiException> { service.listMine(7, 0) }.errorCode)
            assertEquals(UserErrorCode.UNAUTHORIZED_ACCESS, assertThrows<ApiException> { service.getMine(7, 11) }.errorCode)
            assertEquals(UserErrorCode.UNAUTHORIZED_ACCESS, assertThrows<ApiException> {
                service.create(7, InquiryCreateRequest(InquiryCategory.USAGE, "제목", "내용"))
            }.errorCode)
        }
        verifyNoInteractions(inquiries)
    }
}
