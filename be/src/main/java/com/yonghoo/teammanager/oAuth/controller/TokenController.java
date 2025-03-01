package com.yonghoo.teammanager.oAuth.controller;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yonghoo.teammanager.oAuth.annotation.Login;
import com.yonghoo.teammanager.oAuth.dto.RefreshTokenDto;
import com.yonghoo.teammanager.oAuth.entity.User;
import com.yonghoo.teammanager.oAuth.service.OAuthService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/token")
@RequiredArgsConstructor
public class TokenController {
	private final OAuthService oAuthService;
	@Value("${fe.url}")
	private String feUrl;

	@Operation(summary = "토큰 검증", description = "토큰 검증")
	@GetMapping("/verify")
	public ResponseEntity<Void> verifyToken(@Login User user) {
		if (Objects.isNull(user)) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		} else {
			return ResponseEntity.ok().build();
		}
	}

	@Operation(summary = "accessToken 재발급")
	@PostMapping("/renew")
	public ResponseEntity<Void> renewAccessToken(@RequestBody RefreshTokenDto refreshTokenDto,
		HttpServletResponse response) throws Exception {
		String domain = oAuthService.getDomain(feUrl);
		response.addHeader("set-Cookie", oAuthService.renewAccessToken(refreshTokenDto, domain));

		return ResponseEntity.ok().build();
	}
}
