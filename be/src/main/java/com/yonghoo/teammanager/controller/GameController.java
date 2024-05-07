package com.yonghoo.teammanager.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yonghoo.teammanager.dto.GameDto;
import com.yonghoo.teammanager.service.GameService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/games")
@Tag(name = "Game API", description = "시합 관련 API")
public class GameController {
	private final GameService gameService;

	@GetMapping
	public ResponseEntity<Page<GameDto.Response>> getGames(Pageable pageable) {
		return ResponseEntity.ok().body(gameService.getGames(pageable));
	}

	@PostMapping
	public ResponseEntity<Void> saveGame(@Validated @RequestBody GameDto.Request gameDto) {
		gameService.saveGame(gameDto);
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}
}
