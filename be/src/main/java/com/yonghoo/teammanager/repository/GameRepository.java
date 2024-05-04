package com.yonghoo.teammanager.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.yonghoo.teammanager.entity.Game;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
	Page<Game> findAllByOrderByGameStartAtDesc(Pageable pageable);
}
