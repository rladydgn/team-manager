package com.yonghoo.team_manager.inquiry

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.inquiry.controller.InquiryController
import com.yonghoo.team_manager.inquiry.domain.InquiryCategory
import com.yonghoo.team_manager.inquiry.domain.InquiryStatus
import com.yonghoo.team_manager.inquiry.dto.InquiryCreateRequest
import com.yonghoo.team_manager.inquiry.dto.InquiryListResponse
import com.yonghoo.team_manager.inquiry.dto.InquiryResponse
import com.yonghoo.team_manager.inquiry.service.InquiryService
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.*
import org.springframework.http.MediaType
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule
import java.time.LocalDateTime

class InquiryControllerTest {
    private val service = mock(InquiryService::class.java)
    private val controller = InquiryController(service)
    private val request = InquiryCreateRequest(InquiryCategory.BUG, "오류 문의", "오류 내용")
    private val mvc = MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(GlobalExceptionHandler())
        .setMessageConverters(JacksonJsonHttpMessageConverter(
            JsonMapper.builder().addModule(KotlinModule.Builder().build()).build(),
        ))
        .build()

    @Test
    fun `로그인 정보가 없으면 등록 목록 상세 요청을 모두 거부한다`() {
        assertEquals(UserErrorCode.UNAUTHORIZED_ACCESS, assertThrows<ApiException> { controller.create(null, request) }.errorCode)
        assertEquals(UserErrorCode.UNAUTHORIZED_ACCESS, assertThrows<ApiException> { controller.listMine(null, 0) }.errorCode)
        assertEquals(UserErrorCode.UNAUTHORIZED_ACCESS, assertThrows<ApiException> { controller.getMine(null, 11) }.errorCode)
        verifyNoInteractions(service)
    }

    @Test
    fun `인증된 사용자로 요청을 처리하고 비공개 응답의 캐시를 금지한다`() {
        val detail = InquiryResponse(11, InquiryCategory.BUG, request.title, request.content, InquiryStatus.WAITING, LocalDateTime.now())
        `when`(service.create(7, request)).thenReturn(detail)
        `when`(service.listMine(7, 0)).thenReturn(InquiryListResponse(emptyList(), 0, 20, false))
        `when`(service.getMine(7, 11)).thenReturn(detail)
        val created = controller.create(7, request)
        assertEquals(201, created.statusCode.value())
        assertEquals("no-store", created.headers.cacheControl)
        assertEquals("no-store", controller.listMine(7, 0).headers.cacheControl)
        assertEquals("no-store", controller.getMine(7, 11).headers.cacheControl)
        verify(service).create(7, request)
        verify(service).getMine(7, 11)
        verify(service).listMine(7, 0)
    }

    @Test
    fun `잘못된 카테고리나 요청 형식은 400 응답으로 처리한다`() {
        for (body in listOf(
            """{"category":"INVALID","title":"title","content":"content"}""",
            """{"category":"BUG","title":"title"}""",
            """{"category":"BUG","title":null,"content":"content"}""",
            """{"category":"BUG","title":"unfinished""",
        )) {
            mvc.perform(post("/inquiries")
                .requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 7L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
                .andExpect(status().isBadRequest)
        }
        verifyNoInteractions(service)
    }

    @Test
    fun `쿼리의 사용자 ID 대신 인증된 사용자 ID로 문의를 생성한다`() {
        val detail = InquiryResponse(11, InquiryCategory.BUG, request.title, request.content, InquiryStatus.WAITING, LocalDateTime.now())
        `when`(service.create(7, request)).thenReturn(detail)
        mvc.perform(post("/inquiries")
            .requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 7L)
            .param("userId", "999")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""{"category":"BUG","title":"오류 문의","content":"오류 내용"}"""))
            .andExpect(status().isCreated)
        verify(service).create(7, request)
        verify(service, never()).create(999, request)
    }
}
