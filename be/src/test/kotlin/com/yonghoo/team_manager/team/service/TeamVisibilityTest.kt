package com.yonghoo.team_manager.team.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.yonghoo.team_manager.match.repository.MatchParticipantRepository
import com.yonghoo.team_manager.match.repository.MatchRepository
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import java.time.LocalDateTime

class TeamVisibilityTest {
    private val repository = mock(TeamRepository::class.java)
    private val service = TeamService(repository, mock(UserRepository::class.java), ObjectMapper(),
        mock(MatchRepository::class.java), mock(MatchParticipantRepository::class.java))
    private val now = LocalDateTime.now()
    private val team = TeamRecord(1, 7, TeamCategory.SOCCER, "테스트 팀", null, null, null,
        null, null, null, null, TeamStatus.ACTIVE, now, now, null)

    @Test
    fun `비로그인 사용자는 팀 소개만 조회하고 팀원 목록은 조회하지 않는다`() {
        `when`(repository.selectTeamById(1)).thenReturn(team)
        `when`(repository.countActiveMembers(1)).thenReturn(2L)
        val result = service.getTeam(1, null)
        assertEquals("테스트 팀", result.team.name)
        assertTrue(result.members.isEmpty())
        assertEquals(2L, result.memberCount)
        verify(repository, never()).selectMembersByTeamId(1)
    }

    @Test
    fun `가입 대기 탈퇴 차단 등 활성 팀원이 아닌 사용자는 팀원 목록을 받지 못한다`() {
        `when`(repository.selectTeamById(1)).thenReturn(team)
        `when`(repository.existsActiveMember(1, 8)).thenReturn(false)
        assertTrue(service.getTeam(1, 8).members.isEmpty())
        verify(repository, never()).selectMembersByTeamId(1)
    }

    @Test
    fun `활성 팀원은 팀원 목록을 조회한다`() {
        `when`(repository.selectTeamById(1)).thenReturn(team)
        `when`(repository.existsActiveMember(1, 7)).thenReturn(true)
        val member = TeamMemberRecord(2, 1, 7, "팀원", "메모", TeamMemberRole.MEMBER,
            TeamMemberStatus.ACTIVE, now, now, now, null)
        `when`(repository.selectMembersByTeamId(1)).thenReturn(listOf(member))
        val result = service.getTeam(1, 7)
        assertEquals(listOf(2L), result.members.map { it.id })
        assertEquals("메모", result.members.single().memo)
    }
}
