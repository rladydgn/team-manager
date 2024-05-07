package com.yonghoo.teammanager.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.yonghoo.teammanager.dto.GameDto;
import com.yonghoo.teammanager.entity.Game;
import com.yonghoo.teammanager.repository.GameRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GameService {
	private final GameRepository gameRepository;

	public void saveGame(GameDto.Request gameDto) {
		Game game = gameDto.toEntity();
		gameRepository.save(game);
	}

	public Page<GameDto.Response> getGames(Pageable pageable) {
		Page<Game> gameEntities = gameRepository.findAllByOrderByGameStartAtDesc(pageable);
		return gameEntities.map(GameDto.Response::fromEntity);
	}

	public void removeGame(long id) {
		gameRepository.deleteById(id);
	}
}
