CREATE TABLE player (
    id bigint NOT NULL AUTO_INCREMENT,
    type varchar(200),
    born_at datetime,
    created_at datetime,
    updated_at datetime,
    PRIMARY KEY (id)
);

CREATE TABLE game (
    id bigint NOT NULL AUTO_INCREMENT,
    opponent varchar(500),
    place varchar(1000),
    game_start_at datetime,
    game_end_at datetime,
    created_at datetime,
    updated_at datetime,
    PRIMARY KEY (id)
);

CREATE TABLE game_player (
    id bigint NOT NULL AUTO_INCREMENT,
    game_id long,
    player_id long,
    attendance varchar(200),
    created_at datetime,
    updated_at datetime,
    PRIMARY KEY (id)
);

CREATE TABLE dues (
    id bigint NOT NULL AUTO_INCREMENT,
    player_id long,
    game_id long,
    type varchar(200),
    amount long,
    paid_at datetime,
    created_at datetime,
    updated_at datetime,
    PRIMARY KEY (id)
);

DROP TABLE player;
DROP TABLE game;
DROP TABLE game_player;
DROP TABLE dues;

ALTER TABLE game ADD COLUMN title varchar(500) NOT NULL DEFAULT "test";
ALTER TABLE game ADD COLUMN type varchar(500) NOT NULL DEFAULT "풋살";