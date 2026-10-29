package com.yonghoo.team_manager.fee.service

import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.fee.domain.*
import com.yonghoo.team_manager.fee.dto.TeamFeePaymentUpdateRequest
import com.yonghoo.team_manager.fee.repository.TeamFeePaymentRepository
import com.yonghoo.team_manager.team.domain.*
import com.yonghoo.team_manager.team.dto.TeamCreateRequest
import com.yonghoo.team_manager.team.repository.TeamRepository
import org.jetbrains.exposed.v1.jdbc.*
import org.jetbrains.exposed.v1.jdbc.transactions.transaction
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.nio.file.Files
import java.nio.file.Path
import java.util.UUID

class FeePaymentLeaveTest {
    @Test
    fun `휴원은 해당 월에 저장 및 재조회되고 메모와 다른 달 및 소속을 보존한다`() {
        val db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
        transaction(db) {
            SchemaUtils.create(TeamsTable, TeamMembersTable, TeamFeePaymentsTable)
            val teams = TeamRepository()
            val payments = TeamFeePaymentRepository()
            val service = FeePaymentService(payments, teams)
            val team = teams.createTeam(10, TeamCreateRequest("휴원 테스트"))
            val owner = teams.createTeamMember(team.id, 10, "팀장", TeamMemberRole.OWNER)
            teams.createTeamMember(team.id, 20, "부팀장", TeamMemberRole.SUB_MANAGER)
            teams.createTeamMember(team.id, 30, "팀원", TeamMemberRole.MEMBER)
            val request = TeamFeePaymentUpdateRequest(owner.id, 2026, 10, FeePaymentStatus.PAID, "기존 메모")
            service.updateTeamFeePayment(team.id, 10, request)
            val saved = service.updateTeamFeePayment(team.id, 20, request.copy(status = FeePaymentStatus.ON_LEAVE))
            assertEquals(FeePaymentStatus.ON_LEAVE, saved.status)
            assertEquals("기존 메모", saved.memo)
            val months = service.getTeamFeePayments(team.id, 10, 2026).members.single { it.teamMemberId == owner.id }.payments
            assertEquals(FeePaymentStatus.ON_LEAVE, months[9].status)
            assertTrue(months.filter { it.paymentMonth != 10 }.all { it.status == FeePaymentStatus.UNPAID })
            assertEquals(TeamMemberStatus.ACTIVE, teams.selectTeamMemberById(team.id, owner.id)!!.status)
            assertEquals(1, payments.selectPaymentsByTeamAndYear(team.id, 2026).size)
            assertThrows<ApiException> { service.updateTeamFeePayment(team.id, 30, request) }
            assertThrows<ApiException> { service.getTeamFeePayments(team.id, 30, 2026) }
            service.updateTeamFeePayment(team.id, 10, request)
            assertEquals(FeePaymentStatus.PAID, payments.selectPaymentsByTeamAndYear(team.id, 2026).single().status)
        }
    }

    @Test
    fun `휴원 추가 DDL은 기존 상태와 메모 및 기본값을 보존한다`() {
        val schema = Files.readString(Path.of("src/main/resources/schema.sql"))
        val ddl = Regex("CREATE TABLE team_fee_payments \\(.*?;", RegexOption.DOT_MATCHES_ALL).find(schema)!!.value
        val upgrade = Files.readString(Path.of("src/main/resources/change_schema.sql"))
            .substringAfter("-- Fee ON_LEAVE (2026-10-29):").substringAfter('\n')
            .substringBefore("-- Team images (2026-10-30):")
        for (existing in listOf(false, true)) {
            val db = Database.connect("jdbc:h2:mem:${UUID.randomUUID()};MODE=MySQL;DB_CLOSE_DELAY=-1", driver = "org.h2.Driver")
            transaction(db) {
                maxAttempts = 1
                exec(if (existing) ddl.replace(", 'ON_LEAVE'", "") else ddl)
                for (status in listOf("PAID", "UNPAID", "INJURED", "EXEMPT")) {
                    exec("INSERT INTO team_fee_payments (team_id,team_member_id,payment_year,payment_month,status,memo) VALUES (1,1,2026,1,'$status','memo')")
                }
                if (existing) upgrade.lineSequence().filterNot { it.trimStart().startsWith("--") }.joinToString("\n")
                    .split(';').filter(String::isNotBlank).forEach { exec(it) }
                exec("INSERT INTO team_fee_payments (team_id,team_member_id,payment_year,payment_month,status) VALUES (1,1,2026,2,'ON_LEAVE')")
                exec("INSERT INTO team_fee_payments (team_id,team_member_id,payment_year,payment_month) VALUES (1,1,2026,3)")
                val rows = TeamFeePaymentRepository().selectPaymentsByTeamAndYear(1, 2026)
                assertEquals(listOf("PAID", "UNPAID", "INJURED", "EXEMPT"), rows.take(4).map { it.status.name })
                assertTrue(rows.take(4).all { it.memo == "memo" })
                assertEquals(FeePaymentStatus.ON_LEAVE, rows[4].status)
                assertEquals(FeePaymentStatus.UNPAID, rows[5].status)
            }
        }
    }
}
