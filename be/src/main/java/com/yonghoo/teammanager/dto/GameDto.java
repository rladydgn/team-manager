package com.yonghoo.teammanager.dto;

import java.time.LocalDateTime;

import com.yonghoo.teammanager.entity.Game;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

public class GameDto {
	@Setter
	@ToString
	public static class Request {
		private String opponent;

		@NotBlank
		private String title;

		@NotBlank
		private String place;

		@NotBlank
		private String type;

		@NotNull
		private LocalDateTime gameStartAt;

		@NotNull
		private LocalDateTime gameEndAt;

		public Game toEntity() {
			return Game.builder()
				.title(title)
				.opponent(opponent)
				.place(place)
				.type(type)
				.gameStartAt(gameStartAt)
				.gameEndAt(gameEndAt)
				.build();
		}
	}

	@Builder
	@Getter
	public static class Response {
		private long id;

		private String title;

		private String opponent;

		private String place;

		private String type;

		private LocalDateTime gameStartAt;

		private LocalDateTime gameEndAt;

		public static Response fromEntity(Game game) {
			return Response.builder()
				.id(game.getId())
				.title(game.getTitle())
				.opponent(game.getOpponent())
				.place(game.getPlace())
				.type(game.getType())
				.gameStartAt(game.getGameStartAt())
				.gameEndAt(game.getGameEndAt())
				.build();
		}
	}
}
