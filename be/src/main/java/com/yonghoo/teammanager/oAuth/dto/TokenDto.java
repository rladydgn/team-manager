package com.yonghoo.teammanager.oAuth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TokenDto {
	private String accessToken;
	private String refreshToken;
}
