package com.yonghoo.teammanager.oAuth.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yonghoo.teammanager.oAuth.dto.KaKaoTokenResponseDto;
import com.yonghoo.teammanager.oAuth.dto.TokenDto;
import com.yonghoo.teammanager.oAuth.entity.User;
import com.yonghoo.teammanager.oAuth.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class KaKaoOAuthService {
	//github.com/jwtk/jjwt (JWTs 문서)
	private final ObjectMapper objectMapper;
	private final OAuthService oAuthService;
	private final UserRepository userRepository;
	@Value("${oauth.kakao.client-id}")
	private String clientId;
	@Value("${oauth.kakao.redirect-url}")
	private String redirectUrl;
	@Value("${jwt.secret}")
	private String secret;
	private static final long THIRTY_DAYS_SECOND = 30L * 24L * 60L * 60L;

	public KaKaoTokenResponseDto getKaKaoToken(String code) {
		RestClient restCl = RestClient.builder()
			.baseUrl("https://kauth.kakao.com")
			.defaultHeader(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded;charset=utf-8")
			.build();

		try {
			return restCl.post()
				.uri(uriBuilder -> uriBuilder.path("/oauth/token")
					.queryParam("grant_type", "authorization_code")
					.queryParam("client_id", clientId)
					.queryParam("redirect_uri", redirectUrl)
					.queryParam("code", code)
					.build())
				.retrieve()
				.body(KaKaoTokenResponseDto.class);
		} catch (Exception e) {
			log.error("[카카오 로그인 토큰 발급 실패] " + e.getMessage());
			throw e;
		}
	}

	public User getUser(KaKaoTokenResponseDto kaKaoTokenResponseDto) throws Exception {
		RestClient webClient = RestClient.builder()
			.baseUrl("https://kapi.kakao.com")
			.defaultHeader(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded;charset=utf-8")
			.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + kaKaoTokenResponseDto.getAccessToken())
			.build();

		try {
			String res = webClient.post()
				.uri(uriBuilder -> uriBuilder.path("/v2/user/me").build())
				.retrieve()
				.body(String.class);

			// kakao 에서 받은 유저 정보 파싱
			JsonNode root = objectMapper.readTree(res);
			log.info("[카카오 유저 정보]: " + root.toString());
			String id = root.path("id").asText();
			String nickname = root.path("kakao_account").path("profile").path("nickname").asText();
			String email = root.path("kakao_account").path("email").asText();
			return User.builder().nickname(nickname).email(email).provider("kakao").authId(id).build();
		} catch (Exception e) {
			log.error("[카카오 로그인 유저 정보 가져오기 실패] " + e.getMessage());
			throw e;
		}
	}

	public TokenDto getAuthToken(String code, String domain) throws Exception {
		KaKaoTokenResponseDto kaKaoTokenResponseDto = getKaKaoToken(code);
		User user = getUser(kaKaoTokenResponseDto);

		Optional<User> savedUser = userRepository.findByEmailAndProvider(user.getEmail(), "kakao");
		if (savedUser.isEmpty()) {
			userRepository.save(user);
		} else if (savedUser.get().getAuthId() == null) {
			// auth_id 저장용 로직 추후 삭제
			savedUser.get().setAuthId(user.getAuthId());
			userRepository.save(savedUser.get());
		}

		TokenDto tokenDto = oAuthService.makeToken(user);

		tokenDto.setAccessToken(ResponseCookie.from("accessToken", tokenDto.getAccessToken())
			.domain(domain)
			.path("/")
			.maxAge(THIRTY_DAYS_SECOND)
			.build()
			.toString());

		tokenDto.setRefreshToken(ResponseCookie.from("refreshToken", tokenDto.getRefreshToken())
			.domain(domain)
			.path("/")
			.maxAge(THIRTY_DAYS_SECOND * 3)
			.build()
			.toString());

		return tokenDto;
	}
}
