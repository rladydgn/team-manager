package com.yonghoo.teammanager.oAuth.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.yonghoo.teammanager.oAuth.dto.TokenDto;
import com.yonghoo.teammanager.oAuth.service.KaKaoOAuthService;
import com.yonghoo.teammanager.oAuth.service.OAuthService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/oauth")
@RequiredArgsConstructor
@Slf4j
public class OAuthController {
	private final OAuthService oAuthService;
	private final KaKaoOAuthService kaKaoOAuthService;
	@Value("${fe.url}")
	private String feUrl;

	// 로그인 https://kauth.kakao.com/oauth/authorize?client_id=e18322b45272d9a5fa472bbd499cb624&redirect_uri	=http://localhost:8080/oauth/redirect&response_type=code
	@Operation(summary = "oauth 카카오 로그인 리다이렉트")
	@GetMapping("/redirect")
	public void redirect(@RequestParam("code") String code, HttpServletResponse response) throws Exception {

		// 쿠키 허용 도메인
		String domain = oAuthService.getDomain(feUrl);
		TokenDto tokenDto = kaKaoOAuthService.getAuthToken(code, domain);

		response.addHeader("set-Cookie", tokenDto.getAccessToken());
		response.addHeader("set-Cookie", tokenDto.getRefreshToken());

		response.sendRedirect(feUrl);
	}

	@Operation
	@GetMapping("/logout")
	public ResponseEntity<Void> logout(HttpServletResponse response) {

		TokenDto tokenDto = oAuthService.clearCookie();

		response.addHeader("set-Cookie", tokenDto.getAccessToken());
		response.addHeader("set-Cookie", tokenDto.getRefreshToken());

		return ResponseEntity.ok().build();
	}
}
