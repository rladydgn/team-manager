package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.handler.GlobalExceptionHandler
import com.yonghoo.team_manager.match.controller.FormationRequestExceptionHandler
import com.yonghoo.team_manager.match.controller.MatchFormationController
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.http.MediaType
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule

class MatchFormationControllerTest {
    private val service = mock(MatchFormationService::class.java)
    private val mvc = MockMvcBuilders.standaloneSetup(MatchFormationController(service))
        .setControllerAdvice(FormationRequestExceptionHandler(), GlobalExceptionHandler())
        .setMessageConverters(JacksonJsonHttpMessageConverter(JsonMapper.builder().addModule(KotlinModule.Builder().build()).build()))
        .build()

    @Test
    fun `malformed JSON null fields numeric strings and fractions return 400`() {
        val base = """{"title":"1쿼터","side":"HOME","templateId":"4-4-2","placements":[]}"""
        for (body in listOf("{", "{}", base.replace("\"1쿼터\"", "null"), base.replace("\"1쿼터\"", "123"),
            base.replace("[]", "null"), base.replace("[]", "[null]"), base.replace("[]", """[{"slotId":"GK","teamMemberId":1.5}]"""),
            base.replace("[]", """[{"slotId":"GK","teamMemberId":"1"}]"""))) {
            mvc.perform(post("/matches/1/formations").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L)
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.code").value("INVALID_MATCH_FORMATION_REQUEST"))
        }
        mvc.perform(delete("/matches/1/formations/1").requestAttr(AUTHENTICATED_USER_ID_ATTRIBUTE, 10L))
            .andExpect(status().isBadRequest)
        verifyNoInteractions(service)
    }

    @Test
    fun `missing authentication remains 401 for cookie refresh`() {
        mvc.perform(get("/matches/1/formations")).andExpect(status().isUnauthorized)
        verifyNoInteractions(service)
    }
}
