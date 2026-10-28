package com.yonghoo.team_manager.match.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.match.domain.*
import com.yonghoo.team_manager.match.dto.*
import com.yonghoo.team_manager.match.repository.*
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.repository.TeamRepository
import com.yonghoo.team_manager.user.repository.UserRepository
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.Mockito.mock
import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDateTime
import java.util.UUID

class InternalMatchRecordTest {
    private lateinit var db: Database
    private val participants = MatchParticipantRepository()
    private val matches = MatchRepository()
    private val service = MatchService(participants, matches, TeamRepository(), mock(UserRepository::class.java))
    private val formations = MatchFormationService(MatchFormationRepository())
    private fun <T> tx(block: () -> T): T = transaction(db) { block() }
    private fun players() = participants.selectParticipantsByMatchIds(listOf(1)).sortedBy { it.teamMemberId }
    private fun player(id: Long, side: MatchTeamSide, goals: Int) = MatchParticipantStatisticsUpdateRequest(id, true, false, goals, 0, 0, side)
    private fun request(version: Long = 1, confirm: Boolean = false) = MatchRecordUpdateRequest(0,
        participants = listOf(player(1, MatchTeamSide.HOME, 2), player(2, MatchTeamSide.AWAY, 1), player(3, MatchTeamSide.UNASSIGNED, 0)),
        internalRecord = InternalMatchRecordUpdateRequest(version, 0, 0, 0, 0, confirm))

    @BeforeEach
    fun setup() {
        db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        tx {
            SchemaUtils.create(TeamsTable, TeamMembersTable, MatchesTable, MatchParticipantsTable, MatchFormationsTable, MatchFormationPlacementsTable)
            TeamsTable.insert { it[id] = 1; it[createdByUserId] = 10; it[name] = "자체 경기 팀" }
            for (member in 1L..3L) TeamMembersTable.insert {
                it[id] = member; it[teamId] = 1; it[userId] = if (member == 1L) 10 else if (member == 2L) 20 else null
                it[displayName] = "선수 $member"; it[role] = if (member == 1L) TeamMemberRole.OWNER else TeamMemberRole.MEMBER
                it[status] = if (member == 3L) TeamMemberStatus.LEFT else TeamMemberStatus.ACTIVE
            }
            MatchesTable.insert {
                it[id] = 1; it[teamId] = 1; it[createdByUserId] = 10; it[matchType] = MatchType.INTERNAL
                it[matchAt] = LocalDateTime.now().minusDays(1); it[participationDeadlineAt] = LocalDateTime.now().minusDays(2)
            }
            for (member in 1L..3L) MatchParticipantsTable.insert {
                it[matchId] = 1; it[teamMemberId] = member; it[voteStatus] = MatchParticipantStatus.AVAILABLE
                it[teamSide] = when(member) { 1L -> MatchTeamSide.HOME; 2L -> MatchTeamSide.AWAY; else -> MatchTeamSide.UNASSIGNED }
                it[memo] = "메모 $member"; it[respondedAt] = LocalDateTime.now().minusDays(2)
            }
        }
    }

    @Test
    fun `home two away one and per side unknown counts produce distinct correct totals`() = tx {
        val input = request()
        val result = service.updateMatchRecord(1, 10, input)
        assertEquals(2, result.teamScore); assertEquals(1, result.opponentScore)
        assertTrue(result.internalRecordConfirmed); assertEquals(2L, result.sideAssignmentVersion)
        val next = input.copy(internalRecord = input.internalRecord!!.copy(sideAssignmentVersion = 2,
            homeUnknownGoalCount = 1, homeUnknownAssistCount = 2, awayUnknownGoalCount = 2, awayUnknownAssistCount = 3))
        val saved = service.updateMatchRecord(1, 10, next)
        assertEquals(3, saved.teamScore); assertEquals(3, saved.opponentScore)
        assertEquals(1, saved.unknownGoalCount); assertEquals(2, saved.unknownAssistCount)
        assertEquals(2, saved.awayUnknownGoalCount); assertEquals(3, saved.awayUnknownAssistCount)
        assertEquals(2, players().first().goalCount)
        assertEquals(1, players()[1].goalCount)
    }

    @Test
    fun `unassigned positive statistics per side assists absent statistics and bad counts reject atomically`() = tx {
        val base = request()
        val before = players(); val matchBefore = matches.selectMatchById(1)
        val invalid = listOf(
            base.copy(participants = base.participants.map { if (it.teamMemberId == 1L) it.copy(teamSide = null) else it }),
            base.copy(participants = base.participants.map { if (it.teamMemberId == 1L) it.copy(teamSide = MatchTeamSide.UNASSIGNED) else it }),
            base.copy(participants = base.participants.map { if (it.teamMemberId == 3L) it.copy(assistCount = 1) else it }),
            base.copy(participants = base.participants.map { if (it.teamMemberId == 3L) it.copy(cleanSheetCount = 1) else it }),
            base.copy(participants = base.participants.map { if (it.teamMemberId == 2L) it.copy(assistCount = 2) else it }),
            base.copy(participants = base.participants.map { if (it.teamMemberId == 1L) it.copy(actualParticipated = false) else it }),
            base.copy(internalRecord = base.internalRecord!!.copy(awayUnknownGoalCount = -1)),
            base.copy(internalRecord = base.internalRecord.copy(homeUnknownAssistCount = 100)),
            base.copy(unknownGoalCount = 1), base.copy(internalRecord = null),
        )
        for (input in invalid) {
            assertThrows<ApiException> { service.updateMatchRecord(1, 10, input) }
            assertEquals(before, players()); assertEquals(matchBefore, matches.selectMatchById(1))
        }
        // Unassigned attendance and late arrival are valid without personal statistics.
        service.updateMatchRecord(1, 10, base.copy(participants = base.participants.map { if (it.teamMemberId == 3L) it.copy(late = true) else it }))
        assertTrue(players().last().late)
    }

    @Test
    fun `legacy scores and unknown counts are untouched until explicit conversion`() = tx {
        MatchesTable.update({ MatchesTable.id eq 1 }) {
            it[status] = MatchStatus.COMPLETED; it[teamScore] = 7; it[opponentScore] = 4
            it[unknownGoalCount] = 3; it[unknownAssistCount] = 2
        }
        val before = matches.selectMatchById(1); val beforePlayers = players()
        assertFalse(service.getMatch(1, 10).internalRecordConfirmed)
        assertEquals("INTERNAL_MATCH_RECORD_CONFIRMATION_REQUIRED", assertThrows<ApiException> {
            service.updateMatchRecord(1, 10, request())
        }.errorCode.code)
        assertEquals(before, matches.selectMatchById(1)); assertEquals(beforePlayers, players())
        val converted = service.updateMatchRecord(1, 10, request(confirm = true))
        assertTrue(converted.internalRecordConfirmed)
        assertEquals(2, converted.teamScore); assertEquals(1, converted.opponentScore)
    }

    @Test
    fun `record side correction updates score and version preserving votes memos departed participants and placements`() = tx {
        val formation = formations.save(1, 10, MatchFormationRequest("1쿼터", "HOME", "4-4-2", listOf(FormationPlacementRequest("GK", 1))))
        val originalPlayers = players()
        service.updateMatchRecord(1, 10, request())
        assertFalse(formations.sides(1, 10).canManage)
        assertTrue(formations.sides(1, 10).recordEditingRequired)
        assertEquals("MATCH_SIDE_ASSIGNMENT_RECORD_EDIT_REQUIRED", assertThrows<ApiException> {
            formations.assignSides(1, 10, ParticipantSidesRequest(2, listOf(SideAssignmentRequest(1, "AWAY"))))
        }.errorCode.code)
        val corrected = service.updateMatchRecord(1, 10, request(2).copy(participants = request().participants.map {
            if (it.teamMemberId == 1L) it.copy(teamSide = MatchTeamSide.AWAY) else it
        }))
        assertEquals(0, corrected.teamScore); assertEquals(3, corrected.opponentScore)
        assertEquals(3L, corrected.sideAssignmentVersion)
        assertEquals(originalPlayers.map { Triple(it.id, it.voteStatus, it.memo) }, players().map { Triple(it.id, it.voteStatus, it.memo) })
        assertEquals(originalPlayers.map { it.respondedAt }, players().map { it.respondedAt })
        val updatedFormation = formations.list(1, 10).formations.single()
        assertEquals(formation.version, updatedFormation.version)
        assertEquals("SIDE_MISMATCH", updatedFormation.placements.single().ineligibleReason)
    }

    @Test
    fun `stale side version nonmanager and canceled requests preserve latest data`() = tx {
        formations.assignSides(1, 10, ParticipantSidesRequest(1, listOf(SideAssignmentRequest(1, "AWAY"))))
        val before = players(); val matchBefore = matches.selectMatchById(1)
        assertEquals("INTERNAL_MATCH_RECORD_VERSION_CONFLICT", assertThrows<ApiException> { service.updateMatchRecord(1, 10, request()) }.errorCode.code)
        assertEquals(before, players()); assertEquals(matchBefore, matches.selectMatchById(1))
        assertEquals("MATCH_RECORD_FORBIDDEN", assertThrows<ApiException> { service.updateMatchRecord(1, 20, request(2)) }.errorCode.code)
        service.updateMatchRecord(1, 10, request(2))
        val saved = matches.selectMatchById(1)
        assertThrows<ApiException> { service.updateMatchRecord(1, 10, request(2)) }
        assertEquals(saved, matches.selectMatchById(1))
        MatchesTable.update({ MatchesTable.id eq 1 }) { it[status] = MatchStatus.CANCELED }
        assertEquals("MATCH_RECORD_UNAVAILABLE", assertThrows<ApiException> { service.updateMatchRecord(1, 10, request(3)) }.errorCode.code)
    }

    @Test
    fun `external contract still stores opponent score and aggregate unknown counts without changing sides`() = tx {
        MatchesTable.update({ MatchesTable.id eq 1 }) { it[matchType] = MatchType.EXTERNAL }
        val input = request().copy(opponentScore = 4, unknownGoalCount = 2, unknownAssistCount = 1, internalRecord = null)
        val saved = service.updateMatchRecord(1, 10, input)
        assertEquals(5, saved.teamScore); assertEquals(4, saved.opponentScore)
        assertEquals(2, saved.unknownGoalCount); assertEquals(1, saved.unknownAssistCount)
        assertFalse(saved.internalRecordConfirmed); assertEquals(1L, saved.sideAssignmentVersion)
        assertEquals(MatchTeamSide.UNASSIGNED, players().last().teamSide)
    }

    @Test
    fun `F02 SQL empty install and existing upgrade preserve original scores in H2 MySQL mode`() {
        val schema = Files.readString(Path.of("src/main/resources/schema.sql"))
        val ddl = Regex("CREATE TABLE matches \\(.*?;", RegexOption.DOT_MATCHES_ALL).find(schema)!!.value
        val upgrade = Files.readString(Path.of("src/main/resources/change_schema.sql")).substringAfter("-- F02 (2026-10-28):")
        for (existing in listOf(false, true)) {
            val isolated = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
            transaction(isolated) {
                maxAttempts = 1
                fun sql(script: String) = script.lineSequence().filterNot { it.trimStart().startsWith("--") }
                    .joinToString("\n").split(';').filter(String::isNotBlank).forEach { exec(it) }
                val oldDdl = ddl.replace(Regex("(?m)^\\s*(away_unknown_goal_count|away_unknown_assist_count|internal_record_confirmed) [^\\r\\n]+\\r?\\n"), "")
                sql(if (existing) oldDdl else ddl)
                exec("INSERT INTO matches (team_id, created_by_user_id, match_type, match_at, participation_deadline_at, team_score, opponent_score, unknown_goal_count) VALUES (1,10,'INTERNAL',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,7,4,3)")
                if (existing) sql("-- F02 (2026-10-28):$upgrade")
                val record = matches.selectMatchById(1)!!
                assertEquals(7, record.teamScore); assertEquals(4, record.opponentScore); assertEquals(3, record.unknownGoalCount)
                assertFalse(record.internalRecordConfirmed); assertEquals(0, record.awayUnknownGoalCount)
                assertEquals(1L, record.sideAssignmentVersion)
            }
        }
    }
}
