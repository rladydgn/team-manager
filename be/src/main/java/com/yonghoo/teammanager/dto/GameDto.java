package com.yonghoo.teammanager.dto;

import java.time.LocalDateTime;

import com.yonghoo.teammanager.entity.Game;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.ToString;

public class GameDto {
	@ToString
	public static class Request {
		private String opponent;

		@NotBlank
		private String place;

		@NotNull
		private LocalDateTime gameStartAt;

		@NotNull
		private LocalDateTime gameEndAt;

		public Game toEntity() {
			return Game.builder()
				.opponent(opponent)
				.place(place)
				.gameStartAt(gameStartAt)
				.gameEndAt(gameEndAt)
				.build();
		}
	}

	@Builder
	public static class Response {
		private long id;

		private String opponent;

		private String place;

		private LocalDateTime gameStartAt;

		private LocalDateTime gameEndAt;

		public static Response fromEntity(Game game) {
			return Response.builder()
				.id(game.getId())
				.opponent(game.getOpponent())
				.place(game.getPlace())
				.gameStartAt(game.getGameStartAt())
				.gameEndAt(game.getGameEndAt())
				.build();
		}
	}
}
