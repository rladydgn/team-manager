package com.yonghoo.team_manager.match.domain

import com.yonghoo.team_manager.match.dto.FormationSlot
import com.yonghoo.team_manager.match.dto.FormationTemplate

object FormationTemplates {
    val all = listOf("4-4-2", "4-3-3", "4-2-3-1", "4-1-4-1", "4-3-1-2", "3-5-2", "3-4-3", "5-3-2")
        .map { id ->
            val rows = id.split('-').map(String::toInt)
            FormationTemplate(id, id, listOf(FormationSlot("GK", "골키퍼", 0.5, 0.90)) +
                rows.flatMapIndexed { index, count ->
                    (1..count).map { position ->
                        val label = when (index) {
                            0 -> "수비"
                            rows.lastIndex -> "공격"
                            else -> "중앙 ${index}줄"
                        }
                        FormationSlot("R${index + 1}_$position", "$label $position",
                            position.toDouble() / (count + 1), 0.72 - 0.54 * index / (rows.size - 1))
                    }
                })
        }
}
