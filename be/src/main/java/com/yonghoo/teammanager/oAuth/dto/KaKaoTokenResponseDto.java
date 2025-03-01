package com.yonghoo.teammanager.oAuth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class KaKaoTokenResponseDto {
	@JsonProperty("access_token")
	private String accessToken;
	@JsonProperty("token_type")
	private String tokenType;
	@JsonProperty("refresh_token")
	private String refreshToken;
	@JsonProperty("expires_in")
	private int expiresIn;

	@JsonProperty("scope")
	private String[] scopes;
	@JsonProperty("refresh_token_expires_in")
	private int refreshTokenExpiresIn;

	public void setScopes(String scopes) {
		this.scopes = scopes.split(" ");
	}
}
