package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.controller.MatchController
import com.yonghoo.team_manager.match.domain.MatchNoteVisibility
import com.yonghoo.team_manager.match.domain.MatchRecord
import com.yonghoo.team_manager.match.domain.MatchStatus
import com.yonghoo.team_manager.match.domain.MatchType
import com.yonghoo.team_manager.match.dto.MatchNoteUpdateRequest
import com.yonghoo.team_manager.match.dto.MatchResponse
import com.yonghoo.team_manager.match.exception.MatchErrorCode
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.TeamMemberRecord
import com.yonghoo.team_manager.team.domain.TeamMemberRole
import com.yonghoo.team_manager.team.domain.TeamMemberStatus
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.exception.UserErrorCode
import com.yonghoo.team_manager.user.config.JacksonConfig
import com.yonghoo.team_manager.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.EnumSource
import org.mockito.Mockito.*
import tools.jackson.databind.json.JsonMapper
import java.time.LocalDateTime

class MatchNotesTest {
    private val matches = mock(MatchRepository::class.java)
    private val teams = mock(TeamRepository::class.java)
    private val service = MatchService(
        mock(MatchParticipantRepository::class.java), matches, teams, mock(UserRepository::class.java),
    )
    private val controller = MatchController(service)
    private val now = LocalDateTime.of(2026, 9, 19, 12, 0)
    private val match = MatchRecord(
        id = 1, teamId = 2, matchType = MatchType.INTERNAL, isTraining = false,
        opponentTeamId = null, opponentTeamName = null, createdByUserId = 3,
        matchAt = now, participationDeadlineAt = now.minusDays(1), location = null,
        teamScore = null, unknownGoalCount = 0, opponentScore = null, unknownAssistCount = 0,
        status = MatchStatus.SCHEDULED, createdAt = now, updatedAt = now, deletedAt = null,
        publicNote = "공개 영상 https://youtu.be/example", managerNote = "운영진 비밀 기록",
    )

    @BeforeEach
    fun setup() {
        `when`(matches.selectMatchById(1)).thenReturn(match)
        `when`(teams.existsActiveMember(2, 3)).thenReturn(true)
        setRole(TeamMemberRole.OWNER)
    }

    @ParameterizedTest
    @EnumSource(TeamMemberRole::class, names = ["MEMBER", "GUEST"])
    fun `일반 팀원과 게스트 응답에는 운영진 기록을 포함하지 않는다`(role: TeamMemberRole) {
        setRole(role)
        val response = service.getMatchNotes(1, 3)
        assertEquals(match.publicNote, response.publicNote)
        assertNull(response.managerNote)
        assertFalse(response.canManage)
        val serializedResponses = listOf(
            JsonMapper.builder().build().writeValueAsString(response),
            JacksonConfig().objectMapper().writeValueAsString(response),
        )
        for (json in serializedResponses) {
            assertFalse(json.contains("managerNote"))
            assertFalse(json.contains("운영진 비밀 기록"))
        }
    }

    @ParameterizedTest
    @EnumSource(TeamMemberRole::class, names = ["OWNER", "SUB_MANAGER"])
    fun `운영진은 두 기록을 조회하고 각각 저장할 수 있다`(role: TeamMemberRole) {
        setRole(role)
        assertEquals(match.managerNote, service.getMatchNotes(1, 3).managerNote)
        assertTrue(service.getMatchNotes(1, 3).canManage)
        for (visibility in MatchNoteVisibility.entries) {
            val updated = when (visibility) {
                MatchNoteVisibility.PUBLIC -> match.copy(publicNote = "새 기록")
                MatchNoteVisibility.MANAGERS -> match.copy(managerNote = "새 기록")
            }
            `when`(matches.updateMatchNote(1, visibility, "새 기록")).thenReturn(updated)
            val response = service.updateMatchNote(1, 3, visibility, MatchNoteUpdateRequest("  새 기록  "))
            assertEquals(updated.publicNote, response.publicNote)
            assertEquals(updated.managerNote, response.managerNote)
            verify(matches).updateMatchNote(1, visibility, "새 기록")
        }
    }

    @ParameterizedTest
    @EnumSource(TeamMemberRole::class, names = ["MEMBER", "GUEST"])
    fun `일반 팀원과 게스트는 두 기록 모두 수정할 수 없다`(role: TeamMemberRole) {
        setRole(role)
        for (visibility in MatchNoteVisibility.entries) {
            val error = assertThrows<ApiException> {
                service.updateMatchNote(1, 3, visibility, MatchNoteUpdateRequest("변조"))
            }
            assertEquals(MatchErrorCode.MATCH_RECORD_FORBIDDEN, error.errorCode)
            verify(matches, never()).updateMatchNote(1, visibility, "변조")
        }
    }

    @Test
    fun `비팀원과 탈퇴한 팀원은 기록 조회와 수정을 할 수 없다`() {
        `when`(teams.existsActiveMember(2, 3)).thenReturn(false)
        assertEquals(MatchErrorCode.MATCH_VIEW_FORBIDDEN, assertThrows<ApiException> {
            service.getMatchNotes(1, 3)
        }.errorCode)
        for (visibility in MatchNoteVisibility.entries) {
            assertEquals(MatchErrorCode.MATCH_VIEW_FORBIDDEN, assertThrows<ApiException> {
                service.updateMatchNote(1, 3, visibility, MatchNoteUpdateRequest("변조"))
            }.errorCode)
            verify(matches, never()).updateMatchNote(1, visibility, "변조")
        }
    }

    @Test
    fun `인증되지 않은 요청은 조회와 수정할 수 없다`() {
        assertEquals(UserErrorCode.UNAUTHORIZED_ACCESS, assertThrows<ApiException> {
            controller.getMatchNotes(1, null)
        }.errorCode)
        assertEquals(UserErrorCode.UNAUTHORIZED_ACCESS, assertThrows<ApiException> {
            controller.updateMatchNote(1, MatchNoteVisibility.PUBLIC, null, MatchNoteUpdateRequest("변조"))
        }.errorCode)
        verifyNoInteractions(matches)
    }

    @Test
    fun `존재하지 않거나 삭제된 매치는 기록을 조회할 수 없다`() {
        `when`(matches.selectMatchById(1)).thenReturn(null)
        assertEquals(MatchErrorCode.MATCH_NOT_FOUND, assertThrows<ApiException> {
            service.getMatchNotes(1, 3)
        }.errorCode)
    }

    @ParameterizedTest
    @EnumSource(MatchNoteVisibility::class)
    fun `빈 내용 저장은 선택한 기록만 삭제한다`(visibility: MatchNoteVisibility) {
        val updated = when (visibility) {
            MatchNoteVisibility.PUBLIC -> match.copy(publicNote = null)
            MatchNoteVisibility.MANAGERS -> match.copy(managerNote = null)
        }
        `when`(matches.updateMatchNote(1, visibility, null)).thenReturn(updated)
        val response = service.updateMatchNote(1, 3, visibility, MatchNoteUpdateRequest(" \n "))
        assertEquals(updated.publicNote.orEmpty(), response.publicNote)
        assertEquals(updated.managerNote.orEmpty(), response.managerNote)
        verify(matches).updateMatchNote(1, visibility, null)
    }

    @Test
    fun `기록 길이를 서버에서도 검증한다`() {
        val content = "가".repeat(10_000)
        `when`(matches.updateMatchNote(1, MatchNoteVisibility.PUBLIC, content))
            .thenReturn(match.copy(publicNote = content))
        assertEquals(content, service.updateMatchNote(1, 3, MatchNoteVisibility.PUBLIC, MatchNoteUpdateRequest(content)).publicNote)
        assertEquals(MatchErrorCode.MATCH_NOTE_TOO_LONG, assertThrows<ApiException> {
            service.updateMatchNote(1, 3, MatchNoteVisibility.PUBLIC, MatchNoteUpdateRequest(content + "가"))
        }.errorCode)
        verify(matches, never()).updateMatchNote(1, MatchNoteVisibility.PUBLIC, content + "가")
    }

    @ParameterizedTest
    @EnumSource(MatchStatus::class)
    fun `매치 상태와 점수 기록에 관계없이 내용을 저장한다`(status: MatchStatus) {
        `when`(matches.selectMatchById(1)).thenReturn(match.copy(status = status))
        `when`(matches.updateMatchNote(1, MatchNoteVisibility.PUBLIC, "기록"))
            .thenReturn(match.copy(status = status, publicNote = "기록"))
        service.updateMatchNote(1, 3, MatchNoteVisibility.PUBLIC, MatchNoteUpdateRequest("기록"))
        verify(matches).updateMatchNote(1, MatchNoteVisibility.PUBLIC, "기록")
    }

    @Test
    fun `기록 응답은 캐시하지 않고 기존 매치 응답에는 비공개 필드가 없다`() {
        assertEquals("no-store", controller.getMatchNotes(1, 3).headers.cacheControl)
        val json = JacksonConfig().objectMapper().writeValueAsString(MatchResponse.from(match))
        assertFalse(json.contains("managerNote"))
        assertFalse(json.contains("운영진 비밀 기록"))
    }

    private fun setRole(role: TeamMemberRole) {
        `when`(teams.selectActiveMemberRole(2, 3)).thenReturn(role)
        `when`(teams.selectActiveTeamMemberByTeamAndUser(2, 3)).thenReturn(
            TeamMemberRecord(
                id = 4, teamId = 2, userId = 3, displayName = "팀원", memo = null,
                role = role, status = TeamMemberStatus.ACTIVE, joinedAt = now,
                createdAt = now, updatedAt = now, deletedAt = null,
            ),
        )
    }
}
