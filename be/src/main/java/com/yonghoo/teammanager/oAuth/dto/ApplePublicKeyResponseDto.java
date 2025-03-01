package com.yonghoo.teammanager.oAuth.dto;

import java.util.List;

import lombok.Data;

@Data
public class ApplePublicKeyResponseDto {
	private List<ApplePublicKeyDto> keys;
}
