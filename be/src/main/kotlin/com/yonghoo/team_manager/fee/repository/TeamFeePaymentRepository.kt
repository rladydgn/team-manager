package com.yonghoo.team_manager.fee.repository

import com.yonghoo.team_manager.fee.domain.FeePaymentStatus
import com.yonghoo.team_manager.fee.domain.TeamFeePaymentEntity
import com.yonghoo.team_manager.fee.domain.TeamFeePaymentRecord
import com.yonghoo.team_manager.fee.domain.TeamFeePaymentsTable
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.isNull
import org.springframework.stereotype.Repository
import java.time.LocalDateTime

@Repository
class TeamFeePaymentRepository {
    fun selectPaymentsByTeamAndYear(teamId: Long, paymentYear: Int): List<TeamFeePaymentRecord> {
        return TeamFeePaymentEntity.find {
            (TeamFeePaymentsTable.teamId eq teamId) and
                (TeamFeePaymentsTable.paymentYear eq paymentYear) and
                TeamFeePaymentsTable.deletedAt.isNull()
        }.map(TeamFeePaymentRecord::from)
    }

    fun upsertPayment(
        teamId: Long,
        teamMemberId: Long,
        paymentYear: Int,
        paymentMonth: Int,
        status: FeePaymentStatus,
        memo: String?,
    ): TeamFeePaymentRecord {
        val now = LocalDateTime.now()
        val existingPayment = TeamFeePaymentEntity.find {
            (TeamFeePaymentsTable.teamId eq teamId) and
                (TeamFeePaymentsTable.teamMemberId eq teamMemberId) and
                (TeamFeePaymentsTable.paymentYear eq paymentYear) and
                (TeamFeePaymentsTable.paymentMonth eq paymentMonth) and
                TeamFeePaymentsTable.deletedAt.isNull()
        }.firstOrNull()

        if (existingPayment != null) {
            existingPayment.status = status
            existingPayment.memo = memo
            existingPayment.updatedAt = now
            return TeamFeePaymentRecord.from(existingPayment)
        }

        val payment = TeamFeePaymentEntity.new {
            this.teamId = teamId
            this.teamMemberId = teamMemberId
            this.paymentYear = paymentYear
            this.paymentMonth = paymentMonth
            this.status = status
            this.memo = memo
            createdAt = now
            updatedAt = now
        }

        return TeamFeePaymentRecord.from(payment)
    }
}
