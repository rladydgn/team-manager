package com.yonghoo.team_manager.team.controller

import com.yonghoo.team_manager.team.service.TeamLogoStorage
import org.springframework.http.CacheControl
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Duration

@RestController
@RequestMapping("/teams/logos")
class TeamLogoController(private val storage: TeamLogoStorage) {
    @GetMapping("/{fileName}", produces = [MediaType.IMAGE_PNG_VALUE])
    fun getLogo(@PathVariable fileName: String): ResponseEntity<ByteArray> = ResponseEntity.ok()
        .contentType(MediaType.IMAGE_PNG)
        .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
        .header("X-Content-Type-Options", "nosniff")
        .body(storage.read(fileName))
}
