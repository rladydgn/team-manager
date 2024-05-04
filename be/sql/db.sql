CREATE TABLE player
(
    id         bigint NOT NULL,
    type       varchar(200),
    born_at    datetime,
    created_at datetime,
    updated_at datetime,
    PRIMARY KEY (id)
);

CREATE TABLE game
(
    id             bigint NOT NULL,
    opponent       varchar(500),
    place          varchar(1000),
    match_start_at datetime,
    match_end_at   datetime,
    created_at     datetime,
    updated_at     datetime,
    PRIMARY KEY (id)
);

CREATE TABLE game_player
(
    id         bigint NOT NULL,
    match_id   long,
    player_id  long,
    created_at datetime,
    updated_at datetime,
    PRIMARY KEY (id)
);

CREATE TABLE dues
(
    id         bigint NOT NULL,
    player_id  long,
    match_id   long,
    type       varchar(200),
    amount     long,
    paid_at    datetime,
    created_at datetime,
    updated_at datetime,
    PRIMARY KEY (id)
);
