package com.yonghoo.team_manager.team.controller

import com.yonghoo.team_manager.common.dto.CommonResponse
import com.yonghoo.team_manager.exception.exception.ApiException
import com.yonghoo.team_manager.team.dto.TeamImageOrderRequest
import com.yonghoo.team_manager.team.service.TeamImageService
import com.yonghoo.team_manager.team.exception.TeamErrorCode
import com.yonghoo.team_manager.user.auth.AUTHENTICATED_USER_ID_ATTRIBUTE
import com.yonghoo.team_manager.user.exception.UserErrorCode
import io.swagger.v3.oas.annotations.Operation
import org.springframework.http.CacheControl
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/teams/{teamId}/images")
class TeamImageController(private val service: TeamImageService) {
    @Operation(summary = "팀 홈 이미지 목록 공개 조회")
    @GetMapping
    fun list(@PathVariable teamId: Long) = ResponseEntity.ok().cacheControl(CacheControl.noStore())
        .body(CommonResponse(data = service.list(teamId)))

    @Operation(summary = "팀 홈 이미지 파일 공개 조회")
    @GetMapping("/{imageId}/file", produces = [MediaType.IMAGE_JPEG_VALUE])
    fun file(@PathVariable teamId: Long, @PathVariable imageId: Long): ResponseEntity<ByteArray> = ResponseEntity.ok()
        .contentType(MediaType.IMAGE_JPEG).cacheControl(CacheControl.noStore())
        .header("X-Content-Type-Options", "nosniff").body(service.read(teamId, imageId))

    @Operation(summary = "팀 홈 JPG 이미지 등록")
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun upload(@PathVariable teamId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestPart("image", required = false) image: MultipartFile?,
    ) = CommonResponse(data = service.upload(teamId, actor(userId), image ?: throw ApiException(TeamErrorCode.INVALID_TEAM_IMAGE)))

    @Operation(summary = "팀 홈 이미지 삭제")
    @DeleteMapping("/{imageId}")
    fun delete(@PathVariable teamId: Long, @PathVariable imageId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
    ) = CommonResponse(data = service.delete(teamId, imageId, actor(userId)))

    @Operation(summary = "팀 홈 이미지 순서 변경")
    @PutMapping("/order")
    fun reorder(@PathVariable teamId: Long,
        @RequestAttribute(name = AUTHENTICATED_USER_ID_ATTRIBUTE, required = false) userId: Long?,
        @RequestBody request: TeamImageOrderRequest,
    ) = CommonResponse(data = service.reorder(teamId, actor(userId), request))

    private fun actor(userId: Long?) = userId ?: throw ApiException(UserErrorCode.UNAUTHORIZED_ACCESS)
}
